import { google, calendar_v3 } from "googleapis";
import { getPrisma } from "@/lib/db";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

/**
 * Use google.auth.OAuth2 (the constructor bundled with googleapis) so that
 * the client type matches what google.calendar() and friends expect.
 */
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/calendar/integrations/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate the URL the user visits to authorize Google Calendar access.
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // force to get refresh_token every time
  });
}

/**
 * Exchange an authorization code for tokens and store them in the database.
 */
export async function handleCallback(code: string): Promise<{ id: string; email: string | null }> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("No access token received from Google");
  }

  // Use the token to fetch user info (email)
  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const calendarList = await calendar.calendarList.get({ calendarId: "primary" });
  const email = calendarList.data.summary || null;

  // Upsert the integration record
  const prisma = getPrisma();
  const integration = await prisma.calendarIntegration.upsert({
    where: {
      provider_email: {
        provider: "GOOGLE",
        email: email || "primary",
      },
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      calendarId: "primary",
      calendarName: calendarList.data.summaryOverride || email || "Primary",
      syncEnabled: true,
      lastSyncedAt: new Date(),
    },
    create: {
      provider: "GOOGLE",
      email: email || "primary",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      calendarId: "primary",
      calendarName: calendarList.data.summaryOverride || email || "Primary",
      syncEnabled: true,
      syncDirection: "EXPORT",
      lastSyncedAt: new Date(),
    },
  });

  return { id: integration.id, email };
}

/**
 * Get an authenticated OAuth2 client for a stored integration.
 * Automatically refreshes the token if expired.
 */
export async function getAuthenticatedClient(): Promise<{
  client: OAuth2Client;
  integration: {
    id: string;
    accessToken: string | null;
    refreshToken: string | null;
    tokenExpiry: Date | null;
    calendarId: string | null;
  } | null;
}> {
  const prisma = getPrisma();
  const integration = await prisma.calendarIntegration.findFirst({
    where: { provider: "GOOGLE", syncEnabled: true },
  });

  if (!integration || !integration.accessToken) {
    throw new Error("No Google Calendar integration found. Connect your Google Calendar first.");
  }

  const oauth2Client = getOAuthClient();

  // Check if token is expired and refresh if needed
  const now = Date.now();
  if (integration.tokenExpiry && integration.tokenExpiry.getTime() < now && integration.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: integration.refreshToken,
    });
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update stored tokens
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: credentials.access_token || undefined,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      },
    });

    oauth2Client.setCredentials(credentials);
  } else {
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken || undefined,
    });
  }

  return {
    client: oauth2Client,
    integration: {
      id: integration.id,
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      tokenExpiry: integration.tokenExpiry,
      calendarId: integration.calendarId,
    },
  };
}

/**
 * Convert an internal CalendarEvent to a Google Calendar event resource.
 */
function toGoogleEvent(event: {
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  allDay?: boolean;
  location?: string | null;
  link?: string | null;
  color?: string;
  eventType?: string;
}) {
  const googleEvent: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
    colorId: event.color ? getGoogleColorId(event.color) : undefined,
  };

  if (event.allDay) {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : new Date(start);
    end.setDate(end.getDate() + 1); // Google Calendar all-day events use exclusive end date
    googleEvent.start = { date: start.toISOString().split("T")[0] };
    googleEvent.end = { date: end.toISOString().split("T")[0] };
  } else {
    googleEvent.start = { dateTime: event.startDate.toISOString() };
    googleEvent.end = { dateTime: (event.endDate || event.startDate).toISOString() };
  }

  // Add source link if available
  if (event.link) {
    googleEvent.source = { title: "View in Dashboard", url: event.link };
  }

  return googleEvent;
}

/**
 * Map hex color to Google Calendar colorId (1-11).
 */
function getGoogleColorId(hex: string): string | undefined {
  const colorMap: Record<string, string> = {
    "#3b82f6": "1",   // Blue
    "#10b981": "2",   // Green
    "#8b5cf6": "3",   // Purple
    "#ef4444": "4",   // Red
    "#f59e0b": "5",   // Yellow
    "#ec4899": "6",   // Pink
    "#6366f1": "7",   // Indigo
    "#14b8a6": "8",   // Teal
    "#f97316": "9",   // Orange
    "#84cc16": "10",  // Lime
    "#6b7280": "11",  // Gray
  };
  return colorMap[hex.toLowerCase()] || undefined;
}

/**
 * Export an event to Google Calendar.
 * If the event has a googleEventId in metadata, it updates the existing event.
 * Otherwise, it creates a new event and returns the Google event ID.
 */
export async function exportEvent(event: {
  id: string;
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  allDay?: boolean;
  location?: string | null;
  link?: string | null;
  color?: string;
  eventType?: string;
  metadata?: Record<string, unknown> | null;
}): Promise<string | null> {
  try {
    const { client, integration } = await getAuthenticatedClient();
    if (!integration) return null;

    const calendar = google.calendar({ version: "v3", auth: client });
    const calendarId = integration.calendarId || "primary";
    const googleEvent = toGoogleEvent(event);

    const existingGoogleId = event.metadata?.googleEventId as string | undefined;

    if (existingGoogleId) {
      // Update existing Google Calendar event
      await calendar.events.update({
        calendarId,
        eventId: existingGoogleId,
        requestBody: googleEvent,
      });
      return existingGoogleId;
    } else {
      // Create new Google Calendar event
      const response = await calendar.events.insert({
        calendarId,
        requestBody: googleEvent,
      });
      return response.data.id || null;
    }
  } catch (error) {
    console.error("Failed to export event to Google Calendar:", error);
    return null;
  }
}

/**
 * Delete an event from Google Calendar.
 */
export async function deleteEvent(googleEventId: string): Promise<boolean> {
  try {
    const { client, integration } = await getAuthenticatedClient();
    if (!integration) return false;

    const calendar = google.calendar({ version: "v3", auth: client });
    const calendarId = integration.calendarId || "primary";

    await calendar.events.delete({
      calendarId,
      eventId: googleEventId,
    });
    return true;
  } catch (error) {
    console.error("Failed to delete event from Google Calendar:", error);
    return false;
  }
}

/**
 * Perform a full export sync: push all local events to Google Calendar.
 * Used for the initial sync or manual "Sync All" button.
 */
export async function fullExportSync(): Promise<{
  created: number;
  updated: number;
  failed: number;
}> {
  const prisma = getPrisma();
  let created = 0;
  let updated = 0;
  let failed = 0;

  try {
    const events = await prisma.calendarEvent.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { startDate: "asc" },
    });

    for (const event of events) {
      const metadata = event.metadata as Record<string, unknown> | null;
      const googleEventId = metadata?.googleEventId as string | undefined;

      try {
        const { client, integration } = await getAuthenticatedClient();

        const calendar = google.calendar({ version: "v3", auth: client });
        const calendarId = integration.calendarId || "primary";
        const googleEvent = toGoogleEvent(event);

        if (googleEventId) {
          await calendar.events.update({
            calendarId,
            eventId: googleEventId,
            requestBody: googleEvent,
          });
          updated++;
        } else {
          const response = await calendar.events.insert({
            calendarId,
            requestBody: googleEvent,
          });
          // Store the Google event ID in metadata
          const newGoogleId = response.data.id;
          if (newGoogleId) {
            await prisma.calendarEvent.update({
              where: { id: event.id },
              data: {
                metadata: { ...(metadata || {}), googleEventId: newGoogleId },
              },
            });
          }
          created++;
        }
      } catch {
        failed++;
      }
    }

    // Update last synced timestamp
    await prisma.calendarIntegration.updateMany({
      where: { provider: "GOOGLE", syncEnabled: true },
      data: { lastSyncedAt: new Date() },
    });

    return { created, updated, failed };
  } catch (error) {
    console.error("Full export sync failed:", error);
    return { created: 0, updated: 0, failed: 0 };
  }
}

/**
 * Get the current integration status.
 */
export async function getIntegrationStatus(): Promise<{
  connected: boolean;
  email?: string | null;
  calendarName?: string | null;
  lastSyncedAt?: string | null;
  syncEnabled: boolean;
}> {
  try {
    const prisma = getPrisma();
    const integration = await prisma.calendarIntegration.findFirst({
      where: { provider: "GOOGLE" },
    });

    if (!integration) {
      return { connected: false, syncEnabled: false };
    }

    return {
      connected: true,
      email: integration.email,
      calendarName: integration.calendarName,
      lastSyncedAt: integration.lastSyncedAt?.toISOString() || null,
      syncEnabled: integration.syncEnabled,
    };
  } catch {
    return { connected: false, syncEnabled: false };
  }
}
