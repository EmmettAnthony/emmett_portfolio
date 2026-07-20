import { getPrisma } from "@/lib/db";

const SCOPES = ["Calendars.ReadWrite", "offline_access", "User.Read"];

const TENANT = "common";

/** Microsoft OAuth endpoints */
const AUTH_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`;
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function getConfig() {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/calendar/integrations/outlook/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Outlook Calendar OAuth not configured. Set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET in .env"
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// ── OAuth Flow ───────────────────────────────────────────────────────────────

/**
 * Generate the URL the user visits to authorize Outlook Calendar access.
 */
export function getAuthUrl(): string {
  const { clientId, redirectUri } = getConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    response_mode: "query",
    prompt: "consent",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens and store them in the database.
 */
export async function handleCallback(code: string): Promise<{ id: string; email: string | null }> {
  const { clientId, clientSecret, redirectUri } = getConfig();

  // Exchange code for tokens
  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    throw new Error(`Token exchange failed: ${errBody}`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!tokens.access_token) {
    throw new Error("No access token received from Outlook");
  }

  // Fetch user info to get email
  const userRes = await fetch(`${GRAPH_BASE}/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error("Failed to fetch user info from Microsoft Graph");
  }

  const user = await userRes.json() as { mail?: string; userPrincipalName?: string; displayName?: string };
  const email = user.mail || user.userPrincipalName || null;

  // Fetch calendar info
  const calendarRes = await fetch(`${GRAPH_BASE}/me/calendar`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  let calendarName = null;
  if (calendarRes.ok) {
    const cal = await calendarRes.json() as { name?: string };
    calendarName = cal.name || null;
  }

  // Compute token expiry
  const expiryDate = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

  // Upsert the integration record
  const prisma = getPrisma();
  const integration = await prisma.calendarIntegration.upsert({
    where: {
      provider_email: {
        provider: "OUTLOOK",
        email: email || "primary",
      },
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      tokenExpiry: expiryDate,
      calendarId: "primary",
      calendarName: calendarName || email || "Outlook Calendar",
      syncEnabled: true,
      lastSyncedAt: new Date(),
    },
    create: {
      provider: "OUTLOOK",
      email: email || "primary",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiry: expiryDate,
      calendarId: "primary",
      calendarName: calendarName || email || "Outlook Calendar",
      syncEnabled: true,
      syncDirection: "EXPORT",
      lastSyncedAt: new Date(),
    },
  });

  return { id: integration.id, email };
}

/**
 * Refresh an expired access token using the refresh token.
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const { clientId, clientSecret, redirectUri } = getConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Token refresh failed: ${errBody}`);
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

/**
 * Get an authenticated API access token for the Outlook integration.
 * Automatically refreshes the token if expired.
 */
export async function getAuthenticatedClient(): Promise<{
  accessToken: string;
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
    where: { provider: "OUTLOOK", syncEnabled: true },
  });

  if (!integration || !integration.accessToken) {
    throw new Error(
      "No Outlook Calendar integration found. Connect your Outlook Calendar first."
    );
  }

  let accessToken = integration.accessToken;

  // Check if token is expired and refresh if needed
  const now = Date.now();
  if (integration.tokenExpiry && integration.tokenExpiry.getTime() < now && integration.refreshToken) {
    const refreshed = await refreshAccessToken(integration.refreshToken);

    // Update stored tokens
    const newExpiry = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000);
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: refreshed.access_token,
        tokenExpiry: newExpiry,
      },
    });

    accessToken = refreshed.access_token;
  }

  return {
    accessToken,
    integration: {
      id: integration.id,
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      tokenExpiry: integration.tokenExpiry,
      calendarId: integration.calendarId,
    },
  };
}

// ── Graph API helpers ────────────────────────────────────────────────────────

/**
 * Make an authenticated request to the Microsoft Graph API.
 */
async function graphFetch<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Graph API error (${res.status}): ${errBody}`);
  }

  return res.json() as Promise<T>;
}

// ── Event Conversion ─────────────────────────────────────────────────────────

/**
 * Convert an internal CalendarEvent to a Microsoft Graph event resource.
 */
function toOutlookEvent(event: {
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  allDay?: boolean;
  location?: string | null;
  link?: string | null;
}) {
  const graphEvent: Record<string, unknown> = {
    subject: event.title,
    body: event.description
      ? { contentType: "text", content: event.description }
      : undefined,
    location: event.location
      ? { displayName: event.location }
      : undefined,
  };

  if (event.allDay) {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : new Date(start);
    end.setDate(end.getDate() + 1);
    graphEvent.start = { dateTime: start.toISOString().split("T")[0], timeZone: "UTC" };
    graphEvent.end = { dateTime: end.toISOString().split("T")[0], timeZone: "UTC" };
    graphEvent.isAllDay = true;
  } else {
    graphEvent.start = { dateTime: event.startDate.toISOString(), timeZone: "UTC" };
    graphEvent.end = { dateTime: (event.endDate || event.startDate).toISOString(), timeZone: "UTC" };
  }

  return graphEvent;
}

// ── Event CRUD ───────────────────────────────────────────────────────────────

/**
 * Export an event to Outlook Calendar.
 * If the event has an outlookEventId in metadata, it updates the existing event.
 * Otherwise, it creates a new event and returns the Outlook event ID.
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
  metadata?: Record<string, unknown> | null;
}): Promise<string | null> {
  try {
    const { accessToken, integration } = await getAuthenticatedClient();
    if (!integration) return null;

    const outlookEvent = toOutlookEvent(event);
    const existingOutlookId = event.metadata?.outlookEventId as string | undefined;

    if (existingOutlookId) {
      // Update existing Outlook Calendar event
      await graphFetch(accessToken, `/me/events/${existingOutlookId}`, {
        method: "PATCH",
        body: JSON.stringify(outlookEvent),
      });
      return existingOutlookId;
    } else {
      // Create new Outlook Calendar event
      const created = await graphFetch<{ id: string }>(accessToken, "/me/events", {
        method: "POST",
        body: JSON.stringify(outlookEvent),
      });
      return created.id || null;
    }
  } catch (error) {
    console.error("Failed to export event to Outlook Calendar:", error);
    return null;
  }
}

/**
 * Delete an event from Outlook Calendar.
 */
export async function deleteEvent(outlookEventId: string): Promise<boolean> {
  try {
    const { accessToken, integration } = await getAuthenticatedClient();
    if (!integration) return false;

    await graphFetch(accessToken, `/me/events/${outlookEventId}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error("Failed to delete event from Outlook Calendar:", error);
    return false;
  }
}

// ── Full Sync ────────────────────────────────────────────────────────────────

/**
 * Perform a full export sync: push all local events to Outlook Calendar.
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
      const outlookEventId = metadata?.outlookEventId as string | undefined;

      try {
        const { accessToken, integration } = await getAuthenticatedClient();

        const outlookEvent = toOutlookEvent(event);

        if (outlookEventId) {
          await graphFetch(accessToken, `/me/events/${outlookEventId}`, {
            method: "PATCH",
            body: JSON.stringify(outlookEvent),
          });
          updated++;
        } else {
          const created_event = await graphFetch<{ id: string }>(accessToken, "/me/events", {
            method: "POST",
            body: JSON.stringify(outlookEvent),
          });
          if (created_event.id) {
            await prisma.calendarEvent.update({
              where: { id: event.id },
              data: {
                metadata: { ...(metadata || {}), outlookEventId: created_event.id },
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
      where: { provider: "OUTLOOK", syncEnabled: true },
      data: { lastSyncedAt: new Date() },
    });

    return { created, updated, failed };
  } catch (error) {
    console.error("Full Outlook export sync failed:", error);
    return { created: 0, updated: 0, failed: 0 };
  }
}

// ── Status ───────────────────────────────────────────────────────────────────

/**
 * Get the current Outlook integration status.
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
      where: { provider: "OUTLOOK" },
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
