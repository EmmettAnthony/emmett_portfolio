import { getPrisma } from "@/lib/db";

/**
 * Apple iCloud Calendar integration using CalDAV protocol.
 *
 * iCloud uses CalDAV (RFC 4791) with app-specific passwords.
 * Users generate an app-specific password at https://appleid.apple.com
 * and provide it along with their Apple ID for authentication.
 *
 * Server: https://caldav.icloud.com/
 * Auth: HTTP Basic with Apple ID and app-specific password
 */

const CALDAV_SERVER = "https://caldav.icloud.com";

// ── Config ───────────────────────────────────────────────────────────────────

// ── Basic Auth helper ────────────────────────────────────────────────────────

function basicAuthHeader(appleId: string, appPassword: string): string {
  return "Basic " + Buffer.from(`${appleId}:${appPassword}`).toString("base64");
}

// ── XML Helpers ──────────────────────────────────────────────────────────────

function buildPropfindRequest(props: string[]): string {
  const propXml = props.map((prop) => `      <d:${prop}/>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
${propXml}
  </d:prop>
</d:propfind>`;
}

/**
 * Extract a single text value from a PROPFIND response property.
 * Handles the common pattern <d:prop><d:propertyName xmlns:d="DAV:">value</d:propertyName></d:prop>
 */
function extractPropertyValue(xml: string, localName: string): string | null {
  // Match <d:localName ...>value</d:localName>
  const regex = new RegExp(`<d:${localName}(?:\\s+[^>]*)?>\\s*([\\s\\S]*?)\\s*<\\/d:${localName}>`);
  const match = xml.match(regex);
  if (!match) return null;
  return match[1].trim();
}

/**
 * Extract a property wrapped in a <d:prop> element, then look for a child element
 * containing <d:href>. Used for properties like current-user-principal and
 * calendar-home-set which have href sub-elements.
 */
function extractHrefProperty(xml: string, wrapperLocalName: string): string | null {
  // Match <d:wrapperLocalName ...>...<d:href ...>value</d:href>...</d:wrapperLocalName>
  const wrapperRegex = new RegExp(
    `<d:${wrapperLocalName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/d:${wrapperLocalName}>`
  );
  const wrapperMatch = xml.match(wrapperRegex);
  if (!wrapperMatch) return null;

  const hrefMatch = wrapperMatch[1].match(/<d:href[^>]*>(.*?)<\/d:href>/);
  return hrefMatch ? hrefMatch[1].trim() : null;
}

/**
 * Find the first calendar URL from a PROPFIND multistatus response.
 * Looks for <d:response> blocks that contain <c:calendar> in their resourcetype.
 */
function findCalendarUrl(xml: string): string | null {
  const responseRegex = /<d:response[^>]*>([\s\S]*?)<\/d:response>/g;
  let responseMatch;
  while ((responseMatch = responseRegex.exec(xml)) !== null) {
    const block = responseMatch[1];
    if (block.includes("<c:calendar") || block.includes('xmlns:c="urn:ietf:params:xml:ns:caldav"') && block.includes("<calendar")) {
      const hrefMatch = block.match(/<d:href[^>]*>(.*?)<\/d:href>/);
      if (hrefMatch) {
        return hrefMatch[1].trim();
      }
    }
  }
  return null;
}

/**
 * Extract display name for a calendar.
 */
function extractDisplayName(xml: string, calendarUrl: string): string | null {
  // Find the response block for the given URL
  const responseRegex = /<d:response[^>]*>([\s\S]*?)<\/d:response>/g;
  let responseMatch;
  while ((responseMatch = responseRegex.exec(xml)) !== null) {
    const block = responseMatch[1];
    if (block.includes(escapeXml(calendarUrl))) {
      const name = extractPropertyValue(block, "displayname");
      if (name) return name;
    }
  }
  return null;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
    }
  });
}

// ── CalDAV HTTP Helpers ──────────────────────────────────────────────────────

async function caldavRequest(
  appleId: string,
  appPassword: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${CALDAV_SERVER}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: basicAuthHeader(appleId, appPassword),
    },
  });
}

/**
 * Perform a PROPFIND request and return the response XML text.
 */
async function propfind(
  appleId: string,
  appPassword: string,
  path: string,
  depth: string = "0",
  props: string[] = ["current-user-principal", "resourcetype", "displayname", "calendar-home-set"],
): Promise<string> {
  const body = buildPropfindRequest(props);
  const res = await caldavRequest(appleId, appPassword, path, {
    method: "PROPFIND",
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      Depth: depth,
    },
    body,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "Unknown error");
    throw new Error(`CalDAV PROPFIND failed (${res.status}): ${errBody}`);
  }

  return res.text();
}

// ── Calendar Discovery ───────────────────────────────────────────────────────

interface CalendarInfo {
  url: string;
  name: string;
}

/**
 * Discover the user's calendar(s) via CalDAV discovery.
 * Returns the first writable calendar found.
 */
async function discoverCalendar(
  appleId: string,
  appPassword: string,
): Promise<CalendarInfo> {
  // Step 1: Find the principal URL
  const rootXml = await propfind(appleId, appPassword, "/", "0", [
    "current-user-principal",
  ]);

  const principalHref = extractHrefProperty(rootXml, "current-user-principal");
  if (!principalHref) {
    throw new Error(
      "Could not discover CalDAV principal URL. Check your Apple ID and app-specific password."
    );
  }

  // Step 2: Find the calendar home set
  const principalXml = await propfind(
    appleId,
    appPassword,
    principalHref,
    "0",
    ["calendar-home-set", "displayname"]
  );

  const calendarHomeHref = extractHrefProperty(principalXml, "calendar-home-set");
  if (!calendarHomeHref) {
    throw new Error("Could not discover calendar home set.");
  }

  // Step 3: List calendars
  const calendarsXml = await propfind(
    appleId,
    appPassword,
    calendarHomeHref,
    "1",
    ["resourcetype", "displayname"]
  );

  const calendarUrl = findCalendarUrl(calendarsXml);
  if (!calendarUrl) {
    throw new Error("No writable iCloud calendar found.");
  }

  // Try to get the calendar name
  const displayName = extractDisplayName(calendarsXml, calendarUrl);

  return {
    url: calendarUrl,
    name: displayName || "iCloud Calendar",
  };
}

// ── ICS Generation ───────────────────────────────────────────────────────────

/**
 * Format a Date to ICS datetime format (UTC).
 * Returns YYYYMMDDTHHMMSSZ.
 */
function toIcsDateTime(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

/**
 * Generate a UUID v4.
 */
function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Escape text for ICS format.
 * ICS uses \n, \;, \, etc. for special characters.
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * Convert an internal event to iCalendar (ICS) format for CalDAV PUT.
 */
function toIcsEvent(event: {
  title: string;
  description?: string | null;
  startDate: Date;
  endDate?: Date | null;
  allDay?: boolean;
  location?: string | null;
  link?: string | null;
}): string {
  const uid = generateUuid();
  const now = toIcsDateTime(new Date());
  const dtStart = toIcsDateTime(event.startDate);
  const dtEnd = toIcsDateTime(event.endDate || event.startDate);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Codebuff//iCloud Calendar Sync//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.allDay) {
    // All-day events use VALUE=DATE format without time
    const startDateStr = event.startDate
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");
    const endDate = event.endDate || event.startDate;
    const endDateStr = endDate
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");
    // CalDAV all-day end date is exclusive (day after last day)
    const endDateObj = new Date(endDateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));
    endDateObj.setDate(endDateObj.getDate() + 1);
    const exclusiveEndStr = endDateObj
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");
    lines.push(`DTSTART;VALUE=DATE:${startDateStr}`);
    lines.push(`DTEND;VALUE=DATE:${exclusiveEndStr}`);
  } else {
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
  }

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

// ── Event CRUD ───────────────────────────────────────────────────────────────

/**
 * Export an event to Apple iCloud Calendar via CalDAV.
 * If the event has an appleEventId in metadata, it updates the existing event.
 * Otherwise, it creates a new event and returns the Apple event path.
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
    const { appleId, appPassword, calendarUrl } = await getCredentials();

    const icsContent = toIcsEvent(event);
    const existingAppleId = event.metadata?.appleEventId as string | undefined;

    if (existingAppleId) {
      // Update existing event
      const updateUrl = existingAppleId.startsWith("/") ? existingAppleId : `/${existingAppleId}`;
      const res = await caldavRequest(appleId, appPassword, updateUrl, {
        method: "PUT",
        headers: { "Content-Type": "text/calendar; charset=utf-8" },
        body: icsContent,
      });

      if (!res.ok) {
        console.error(`Failed to update Apple Calendar event (${res.status})`);
        return null;
      }

      return existingAppleId;
    } else {
      // Create new event
      const eventUuid = generateUuid();
      const eventPath = `${calendarUrl.replace(/\/$/, "")}/${eventUuid}.ics`;

      const res = await caldavRequest(appleId, appPassword, eventPath, {
        method: "PUT",
        headers: { "Content-Type": "text/calendar; charset=utf-8" },
        body: icsContent,
      });

      if (!res.ok) {
        console.error(`Failed to create Apple Calendar event (${res.status})`);
        return null;
      }

      return eventPath;
    }
  } catch (error) {
    console.error("Failed to export event to Apple Calendar:", error);
    return null;
  }
}

/**
 * Delete an event from Apple iCloud Calendar via CalDAV.
 */
export async function deleteEvent(appleEventId: string): Promise<boolean> {
  try {
    const { appleId, appPassword } = await getCredentials();

    const deleteUrl = appleEventId.startsWith("/") ? appleEventId : `/${appleEventId}`;
    const res = await caldavRequest(appleId, appPassword, deleteUrl, {
      method: "DELETE",
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to delete event from Apple Calendar:", error);
    return false;
  }
}

// ── Full Sync ────────────────────────────────────────────────────────────────

/**
 * Perform a full export sync: push all local events to Apple iCloud Calendar.
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
      const appleEventId = metadata?.appleEventId as string | undefined;

      try {
        const { appleId, appPassword, calendarUrl } = await getCredentials();
        const icsContent = toIcsEvent(event);

        if (appleEventId) {
          const updateUrl = appleEventId.startsWith("/")
            ? appleEventId
            : `/${appleEventId}`;

          const res = await caldavRequest(appleId, appPassword, updateUrl, {
            method: "PUT",
            headers: { "Content-Type": "text/calendar; charset=utf-8" },
            body: icsContent,
          });

          if (res.ok) {
            updated++;
          } else {
            failed++;
          }
        } else {
          const eventUuid = generateUuid();
          const eventPath = `${calendarUrl.replace(/\/$/, "")}/${eventUuid}.ics`;

          const res = await caldavRequest(appleId, appPassword, eventPath, {
            method: "PUT",
            headers: { "Content-Type": "text/calendar; charset=utf-8" },
            body: icsContent,
          });

          if (res.ok) {
            created++;
            await prisma.calendarEvent.update({
              where: { id: event.id },
              data: {
                metadata: { ...(metadata || {}), appleEventId: eventPath },
              },
            });
          } else {
            failed++;
          }
        }
      } catch {
        failed++;
      }
    }

    await prisma.calendarIntegration.updateMany({
      where: { provider: "APPLE", syncEnabled: true },
      data: { lastSyncedAt: new Date() },
    });

    return { created, updated, failed };
  } catch (error) {
    console.error("Full Apple Calendar sync failed:", error);
    return { created: 0, updated: 0, failed: 0 };
  }
}

// ── Connect / Store Credentials ──────────────────────────────────────────────

/**
 * Test CalDAV connectivity by discovering the user's calendar.
 * Throws if the credentials are invalid or no calendar is found.
 */
export async function testConnection(
  appleId: string,
  appPassword: string,
): Promise<{ calendarUrl: string; calendarName: string }> {
  const calendar = await discoverCalendar(appleId, appPassword);
  return {
    calendarUrl: calendar.url,
    calendarName: calendar.name,
  };
}

/**
 * Store Apple Calendar credentials after successful verification.
 * Uses the refreshToken field to store the Apple ID and accessToken for
 * the app-specific password, since there's no OAuth token exchange.
 */
export async function storeCredentials(
  appleId: string,
  appPassword: string,
  calendarUrl: string,
  calendarName: string,
): Promise<{ id: string }> {
  const prisma = getPrisma();

  const integration = await prisma.calendarIntegration.upsert({
    where: {
      provider_email: {
        provider: "APPLE",
        email: appleId,
      },
    },
    update: {
      accessToken: appPassword,
      refreshToken: appleId,
      calendarId: calendarUrl,
      calendarName,
      syncEnabled: true,
      lastSyncedAt: new Date(),
    },
    create: {
      provider: "APPLE",
      email: appleId,
      accessToken: appPassword,
      refreshToken: appleId,
      calendarId: calendarUrl,
      calendarName,
      syncEnabled: true,
      syncDirection: "EXPORT",
      lastSyncedAt: new Date(),
    },
  });

  return { id: integration.id };
}

// ── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Get stored Apple Calendar credentials for CalDAV operations.
 * The Apple ID is stored in refreshToken and the app-specific password in accessToken.
 * Note: This does NOT follow the OAuth refresh pattern — app-specific passwords
 * are static until revoked by the user at appleid.apple.com.
 */
async function getCredentials(): Promise<{
  appleId: string;
  appPassword: string;
  calendarUrl: string;
}> {
  const prisma = getPrisma();
  const integration = await prisma.calendarIntegration.findFirst({
    where: { provider: "APPLE", syncEnabled: true },
  });

  if (!integration || !integration.accessToken || !integration.refreshToken) {
    throw new Error(
      "No Apple Calendar integration found. Connect your iCloud Calendar first."
    );
  }

  return {
    appleId: integration.refreshToken,
    appPassword: integration.accessToken,
    calendarUrl: integration.calendarId || "",
  };
}

// ── Status ───────────────────────────────────────────────────────────────────

/**
 * Get the current Apple Calendar integration status.
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
      where: { provider: "APPLE" },
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
