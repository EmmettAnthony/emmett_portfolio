import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mockFetch = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", mockFetch);

const mockPrisma = {
  calendarIntegration: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  calendarEvent: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

// ─── Module under test ───────────────────────────────────────────────────────

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

  vi.clearAllMocks();
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

import {
  testConnection,
  storeCredentials,
  exportEvent,
  deleteEvent,
  fullExportSync,
  getIntegrationStatus,
} from "@/lib/calendar/apple";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function okResponse(body: string | Record<string, unknown>, status = 200): Response {
  const textBody = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: true,
    status,
    text: () => Promise.resolve(textBody),
    json: () => Promise.resolve(typeof body === "string" ? JSON.parse(body) : body),
  } as Response;
}

function failResponse(status: number, body: string): Response {
  return {
    ok: false,
    status,
    text: () => Promise.resolve(body),
    json: () => Promise.reject(new Error("Not JSON")),
  } as Response;
}

// Build mock PROPFIND XML responses
function propfindResponseXml(props: Record<string, string>): string {
  const propXml = Object.entries(props)
    .map(([key, value]) => {
      // Special handling for properties with sub-elements (like current-user-principal)
      if (key === "current-user-principal") {
        return `      <d:current-user-principal><d:href>${value}</d:href></d:current-user-principal>`;
      }
      if (key === "calendar-home-set") {
        return `      <d:calendar-home-set><d:href>${value}</d:href></d:calendar-home-set>`;
      }
      return `      <d:${key}>${value}</d:${key}>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/</d:href>
    <d:propstat>
      <d:prop>
${propXml}
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;
}

function calendarListXml(calendars: Array<{ href: string; displayName: string; isCalendar: boolean }>): string {
  const responses = calendars
    .map(
      (cal) => `  <d:response>
    <d:href>${cal.href}</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype>${cal.isCalendar ? "<c:calendar/>" : ""}</d:resourcetype>
        <d:displayname>${cal.displayName}</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
${responses}
</d:multistatus>`;
}

const MOCK_INTEGRATION = {
  id: "int-1",
  accessToken: "test-app-password",
  refreshToken: "test-apple-id@icloud.com",
  calendarId: "/12345/calendars/abc-123/",
  calendarName: "iCloud Calendar",
  syncEnabled: true,
  tokenExpiry: null,
};

// ─── testConnection ──────────────────────────────────────────────────────────

describe("testConnection", () => {
  const appleId = "test@icloud.com";
  const appPassword = "xxxx-xxxx-xxxx-xxxx";

  const principalXml = propfindResponseXml({
    "current-user-principal": "/12345/",
  });

  const calendarHomeXml = propfindResponseXml({
    "calendar-home-set": "/12345/calendars/",
  });

  const calendarsXml = calendarListXml([
    { href: "/12345/calendars/abc-123/", displayName: "My iCloud Calendar", isCalendar: true },
  ]);

  beforeEach(() => {
    // Three sequential PROPFIND calls
    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(calendarHomeXml))
      .mockResolvedValueOnce(okResponse(calendarsXml));
  });

  it("discovers the calendar via three PROPFIND calls and returns URL and name", async () => {
    const result = await testConnection(appleId, appPassword);

    expect(result.calendarUrl).toBe("/12345/calendars/abc-123/");
    expect(result.calendarName).toBe("My iCloud Calendar");

    // Three PROPFIND calls
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // First: root PROPFIND for current-user-principal
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://caldav.icloud.com/",
      expect.objectContaining({
        method: "PROPFIND",
        body: expect.stringContaining("current-user-principal"),
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Basic"),
          Depth: "0",
          "Content-Type": "application/xml; charset=utf-8",
        }),
      })
    );

    // Second: principal PROPFIND for calendar-home-set
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://caldav.icloud.com/12345/",
      expect.objectContaining({
        method: "PROPFIND",
        headers: expect.objectContaining({ Depth: "0" }),
      })
    );

    // Third: calendar home PROPFIND to list calendars
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      "https://caldav.icloud.com/12345/calendars/",
      expect.objectContaining({
        method: "PROPFIND",
        headers: expect.objectContaining({ Depth: "1" }),
      })
    );
  });

  it("falls back to 'iCloud Calendar' when display name is missing", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(calendarHomeXml))
      .mockResolvedValueOnce(okResponse(calendarListXml([
        { href: "/12345/calendars/abc-123/", displayName: "", isCalendar: true },
      ])));

    const result = await testConnection(appleId, appPassword);
    expect(result.calendarName).toBe("iCloud Calendar");
  });

  it("throws when principal URL cannot be discovered", async () => {
    mockFetch.mockReset().mockResolvedValueOnce(okResponse(
      propfindResponseXml({})
    ));

    await expect(testConnection(appleId, appPassword)).rejects.toThrow(
      "Could not discover CalDAV principal URL"
    );
  });

  it("throws when no writable calendar is found", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(calendarHomeXml))
      .mockResolvedValueOnce(okResponse(calendarListXml([
        { href: "/12345/calendars/no-cal/", displayName: "Not a calendar", isCalendar: false },
      ])));

    await expect(testConnection(appleId, appPassword)).rejects.toThrow(
      "No writable iCloud calendar found"
    );
  });

  it("throws when calendar home URL cannot be discovered", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(propfindResponseXml({})));

    await expect(testConnection(appleId, appPassword)).rejects.toThrow(
      "Could not discover calendar home set"
    );
  });

  it("throws when PROPFIND fails with non-200", async () => {
    mockFetch.mockReset().mockResolvedValueOnce(failResponse(401, "Unauthorized"));

    await expect(testConnection(appleId, appPassword)).rejects.toThrow(
      "CalDAV PROPFIND failed (401)"
    );
  });

  it("sends Basic auth with correct credentials", async () => {
    await testConnection(appleId, appPassword);

    const authHeader = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const encoded = Buffer.from(`${appleId}:${appPassword}`).toString("base64");
    expect(authHeader.Authorization).toBe(`Basic ${encoded}`);
  });

  it("discovers calendar using xmlns:c namespace attribute format (no <c:calendar/>)", async () => {
    // XML that uses xmlns:c on the <calendar> element instead of <c:calendar/>
    const namespaceXml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/12345/calendars/abc-123/</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype><c:calendar xmlns:c="urn:ietf:params:xml:ns:caldav"/></d:resourcetype>
        <d:displayname>Namespace Calendar</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    mockFetch.mockReset();
    const principalXml = propfindResponseXml({ "current-user-principal": "/12345/" });
    const calendarHomeXml = propfindResponseXml({ "calendar-home-set": "/12345/calendars/" });

    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(calendarHomeXml))
      .mockResolvedValueOnce(okResponse(namespaceXml));

    const result = await testConnection(appleId, appPassword);
    expect(result.calendarUrl).toBe("/12345/calendars/abc-123/");
    expect(result.calendarName).toBe("Namespace Calendar");
  });

  it("finds calendar URL with <c:calendar/> in resourcetype", async () => {
    // Test findCalendarUrl with <c:calendar/> which matches block.includes("<c:calendar")
    const customXml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/12345/calendars/abc-123/</d:href>
    <d:propstat>
      <d:prop>
        <d:resourcetype><c:calendar/></d:resourcetype>
        <d:displayname>My Calendar</d:displayname>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    mockFetch.mockReset();
    const principalXml = propfindResponseXml({ "current-user-principal": "/12345/" });
    const calendarHomeXml = propfindResponseXml({ "calendar-home-set": "/12345/calendars/" });

    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(calendarHomeXml))
      .mockResolvedValueOnce(okResponse(customXml));

    const result = await testConnection(appleId, appPassword);
    expect(result.calendarUrl).toBe("/12345/calendars/abc-123/");
    expect(result.calendarName).toBe("My Calendar");
  });

  it("handles calendar URLs with XML special characters in extractDisplayName", async () => {
    // Calendar URL contains '&' which exercises escapeXml() switch case inside extractDisplayName.
    // The href is matched as-is from XML, then escapeXml converts '&' to '&amp;'.
    // Since the XML block doesn't contain the escaped form, extractDisplayName returns null
    // and the fallback name "iCloud Calendar" is used.
    const xmlWithAmp = calendarListXml([
      { href: "/12345/calendars/test&abc/", displayName: "My Calendar", isCalendar: true },
    ]);

    mockFetch.mockReset();
    const principalXml = propfindResponseXml({ "current-user-principal": "/12345/" });
    const calendarHomeXml = propfindResponseXml({ "calendar-home-set": "/12345/calendars/" });

    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(calendarHomeXml))
      .mockResolvedValueOnce(okResponse(xmlWithAmp));

    const result = await testConnection(appleId, appPassword);
    // Calendar is found despite & in URL
    expect(result.calendarUrl).toBe("/12345/calendars/test&abc/");
    // Name falls back because escapeXml escapes '&' causing display name match to fail
    expect(result.calendarName).toBe("iCloud Calendar");
  });

  it("handles calendar URLs with ' and \" characters in escapeXml", async () => {
    // Calendar URL contains single-quote which exercises the corresponding escapeXml switch case.
    const xmlWithQuote = calendarListXml([
      { href: "/12345/calendars/te'st\"/", displayName: "Special Calendar", isCalendar: true },
    ]);

    mockFetch.mockReset();
    const principalXml = propfindResponseXml({ "current-user-principal": "/12345/" });
    const calendarHomeXml = propfindResponseXml({ "calendar-home-set": "/12345/calendars/" });

    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(calendarHomeXml))
      .mockResolvedValueOnce(okResponse(xmlWithQuote));

    const result = await testConnection(appleId, appPassword);
    expect(result.calendarUrl).toBe("/12345/calendars/te'st\"/");
    // Name falls back because escapeXml escapes the quotes
    expect(result.calendarName).toBe("iCloud Calendar");
  });

  it("handles calendar URLs with < and > characters in escapeXml", async () => {
    // Calendar URL contains < and > which exercises the corresponding escapeXml switch cases.
    const xmlWithAngles = calendarListXml([
      { href: "/12345/calendars/te<st>/", displayName: "Angular Calendar", isCalendar: true },
    ]);

    mockFetch.mockReset();
    const principalXml = propfindResponseXml({ "current-user-principal": "/12345/" });
    const calendarHomeXml = propfindResponseXml({ "calendar-home-set": "/12345/calendars/" });

    mockFetch
      .mockResolvedValueOnce(okResponse(principalXml))
      .mockResolvedValueOnce(okResponse(calendarHomeXml))
      .mockResolvedValueOnce(okResponse(xmlWithAngles));

    const result = await testConnection(appleId, appPassword);
    // Calendar found despite < and > in URL — extracted as-is by regex from XML
    expect(result.calendarUrl).toBe("/12345/calendars/te<st>/");
    // Name falls back since escapeXml converts < > causing match to fail
    expect(result.calendarName).toBe("iCloud Calendar");
  });
});

// ─── storeCredentials ────────────────────────────────────────────────────────

describe("storeCredentials", () => {
  it("upserts the integration with Apple ID and app-specific password", async () => {
    mockPrisma.calendarIntegration.upsert.mockResolvedValue({ id: "int-1" });

    const result = await storeCredentials(
      "test@icloud.com",
      "xxxx-xxxx-xxxx-xxxx",
      "/12345/calendars/abc-123/",
      "My Calendar"
    );

    expect(result).toEqual({ id: "int-1" });
    expect(mockPrisma.calendarIntegration.upsert).toHaveBeenCalledWith({
      where: {
        provider_email: { provider: "APPLE", email: "test@icloud.com" },
      },
      update: {
        accessToken: "xxxx-xxxx-xxxx-xxxx",
        refreshToken: "test@icloud.com",
        calendarId: "/12345/calendars/abc-123/",
        calendarName: "My Calendar",
        syncEnabled: true,
        lastSyncedAt: expect.any(Date),
      },
      create: {
        provider: "APPLE",
        email: "test@icloud.com",
        accessToken: "xxxx-xxxx-xxxx-xxxx",
        refreshToken: "test@icloud.com",
        calendarId: "/12345/calendars/abc-123/",
        calendarName: "My Calendar",
        syncEnabled: true,
        syncDirection: "EXPORT",
        lastSyncedAt: expect.any(Date),
      },
    });
  });
});

// ─── exportEvent ─────────────────────────────────────────────────────────────

describe("exportEvent", () => {
  const baseEvent = {
    id: "event-1",
    title: "Test Meeting",
    description: "A test meeting description",
    startDate: new Date("2026-07-15T10:00:00Z"),
    endDate: new Date("2026-07-15T11:00:00Z"),
    allDay: false,
    location: "Conference Room",
    link: null as string | null,
  };

  beforeEach(() => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(MOCK_INTEGRATION);
    mockFetch.mockResolvedValue(okResponse(""));
  });

  it("creates a new event via CalDAV PUT and returns the event path", async () => {
    const result = await exportEvent(baseEvent);

    // Should return a path like /12345/calendars/abc-123/{uuid}.ics
    expect(result).toMatch(/^\/12345\/calendars\/abc-123\/.+\.ics$/);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toMatch(/^https:\/\/caldav\.icloud\.com\/12345\/calendars\/abc-123\/.+\.ics$/);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\.ics$/),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "text/calendar; charset=utf-8",
          Authorization: expect.stringContaining("Basic"),
        }),
      })
    );

    // Verify the ICS body contains the event details
    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("END:VCALENDAR");
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain("END:VEVENT");
    expect(body).toContain("SUMMARY:Test Meeting");
    expect(body).toContain("DESCRIPTION:A test meeting description");
    expect(body).toContain("LOCATION:Conference Room");
    expect(body).toContain("DTSTART:20260715T100000Z");
    expect(body).toContain("DTEND:20260715T110000Z");
  });

  it("updates an existing event when appleEventId is in metadata", async () => {
    const result = await exportEvent({
      ...baseEvent,
      metadata: { appleEventId: "/calendars/abc-123/existing.ics" },
    });

    expect(result).toBe("/calendars/abc-123/existing.ics");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://caldav.icloud.com/calendars/abc-123/existing.ics",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("handles all-day events with VALUE=DATE format", async () => {
    await exportEvent({ ...baseEvent, allDay: true });

    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    expect(body).toContain("DTSTART;VALUE=DATE:20260715");
    // All-day end date is exclusive: 2026-07-15 → 2026-07-16
    expect(body).toContain("DTEND;VALUE=DATE:20260716");
  });

  it("omits DESCRIPTION when description is null", async () => {
    await exportEvent({ ...baseEvent, description: null });

    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    expect(body).not.toContain("DESCRIPTION:");
  });

  it("omits LOCATION when not provided", async () => {
    await exportEvent({ ...baseEvent, location: null });

    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    expect(body).not.toContain("LOCATION:");
  });

  it("escapes semicolons and commas in ICS event text", async () => {
    await exportEvent({
      ...baseEvent,
      title: "Test; Meeting",
      description: "Discuss: A, B, C",
      location: "Room; 1, Floor 2",
    });

    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    expect(body).toContain("SUMMARY:Test\\; Meeting");
    expect(body).toContain("DESCRIPTION:Discuss: A\\, B\\, C");
    expect(body).toContain("LOCATION:Room\\; 1\\, Floor 2");
  });

  it("handles newlines and backslashes in ICS event text", async () => {
    await exportEvent({
      ...baseEvent,
      description: "Line 1\\nLine 2",
    });

    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    expect(body).toContain("DESCRIPTION:Line 1\\\\nLine 2");
  });

  it("returns null when no integration is found", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);

    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns null and logs error when CalDAV PUT fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValue(failResponse(500, "Server error"));

    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns null when CalDAV PUT fails for existing event update", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValue(failResponse(500, "Update failed"));

    const result = await exportEvent({
      ...baseEvent,
      metadata: { appleEventId: "/calendars/abc-123/existing.ics" },
    });

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update Apple Calendar event (500)")
    );
    consoleSpy.mockRestore();
  });

  it("updates existing event with appleEventId not starting with slash", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValue(failResponse(500, "Update failed"));

    const result = await exportEvent({
      ...baseEvent,
      metadata: { appleEventId: "calendars/abc-123/no-slash.ics" },
    });

    expect(result).toBeNull();
    // Should have prepended "/" to the eventId before making the request
    expect(mockFetch).toHaveBeenCalledWith(
      "https://caldav.icloud.com/calendars/abc-123/no-slash.ics",
      expect.objectContaining({ method: "PUT" })
    );
    consoleSpy.mockRestore();
  });

  it("returns null when integration exists but accessToken is null", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...MOCK_INTEGRATION,
      accessToken: null,
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns null when integration exists but refreshToken is null", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...MOCK_INTEGRATION,
      refreshToken: null,
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles all-day events without an explicit endDate", async () => {
    await exportEvent({
      ...baseEvent,
      allDay: true,
      endDate: null,
    });

    // Should use startDate as fallback for endDate
    const body = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    // End date is exclusive: 2026-07-15 + 1 day = 2026-07-16
    expect(body).toContain("DTEND;VALUE=DATE:20260716");
  });

  it("returns null when fetch throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ─── deleteEvent ─────────────────────────────────────────────────────────────

describe("deleteEvent", () => {
  beforeEach(() => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(MOCK_INTEGRATION);
    mockFetch.mockResolvedValue(okResponse(""));
  });

  it("deletes an event via CalDAV DELETE", async () => {
    const result = await deleteEvent("/12345/calendars/abc-123/event.ics");

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://caldav.icloud.com/12345/calendars/abc-123/event.ics",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("prepends slash if appleEventId doesn't start with one", async () => {
    await deleteEvent("calendars/abc-123/event.ics");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://caldav.icloud.com/calendars/abc-123/event.ics",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("returns false when no integration exists", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);

    expect(await deleteEvent("event.ics")).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns false when DELETE fails", async () => {
    mockFetch.mockResolvedValue(failResponse(404, "Not Found"));

    expect(await deleteEvent("event.ics")).toBe(false);
  });

  it("returns false and logs error when fetch throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("Network error"));

    expect(await deleteEvent("event.ics")).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ─── fullExportSync ──────────────────────────────────────────────────────────

describe("fullExportSync", () => {
  const mockEvents = [
    {
      id: "evt-1",
      title: "Existing Event",
      description: null,
      startDate: new Date("2026-07-10T14:00:00Z"),
      endDate: null,
      allDay: false,
      location: null,
      link: null,
      metadata: { appleEventId: "/calendars/abc-123/existing.ics" },
    },
    {
      id: "evt-2",
      title: "New Event",
      description: "Brand new event",
      startDate: new Date("2026-07-11T09:00:00Z"),
      endDate: new Date("2026-07-11T10:00:00Z"),
      allDay: false,
      location: "Office",
      link: null,
      metadata: null,
    },
  ];

  beforeEach(() => {
    mockPrisma.calendarEvent.findMany.mockResolvedValue(mockEvents);
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(MOCK_INTEGRATION);

    // Two fetch calls: first update existing, second create new
    mockFetch
      .mockResolvedValueOnce(okResponse("")) // PUT existing
      .mockResolvedValueOnce(okResponse("")); // PUT new
  });

  it("updates existing events and creates new ones via CalDAV PUT", async () => {
    const result = await fullExportSync();

    expect(result.updated).toBe(1);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);

    // PUT for evt-1 (has appleEventId)
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://caldav.icloud.com/calendars/abc-123/existing.ics",
      expect.objectContaining({ method: "PUT" })
    );

    // PUT for evt-2 (no appleEventId)
    const secondUrl = mockFetch.mock.calls[1][0];
    expect(secondUrl).toMatch(/^https:\/\/caldav\.icloud\.com\/12345\/calendars\/abc-123\/.+\.ics$/);

    // New appleEventId stored in metadata
    expect(mockPrisma.calendarEvent.update).toHaveBeenCalledWith({
      where: { id: "evt-2" },
      data: { metadata: expect.objectContaining({ appleEventId: expect.stringMatching(/\.ics$/) }) },
    });

    // Last synced timestamp updated
    expect(mockPrisma.calendarIntegration.updateMany).toHaveBeenCalledWith({
      where: { provider: "APPLE", syncEnabled: true },
      data: { lastSyncedAt: expect.any(Date) },
    });
  });

  it("counts failures when integration is missing mid-sync", async () => {
    mockPrisma.calendarIntegration.findFirst
      .mockReset()
      .mockResolvedValueOnce(MOCK_INTEGRATION) // evt-1 succeeds
      .mockResolvedValueOnce(null); // evt-2 fails

    const result = await fullExportSync();

    expect(result.updated).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.created).toBe(0);
  });

  it("counts failures when a PUT request fails", async () => {
    // Both events will fail their PUT calls
    mockFetch.mockReset().mockResolvedValue(failResponse(500, "Error"));

    const result = await fullExportSync();

    expect(result.failed).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.created).toBe(0);
  });

  it("returns zero counts when findMany fails", async () => {
    mockPrisma.calendarEvent.findMany.mockRejectedValue(new Error("DB error"));

    const result = await fullExportSync();
    expect(result).toEqual({ created: 0, updated: 0, failed: 0 });
  });

  it("handles events with null metadata", async () => {
    mockPrisma.calendarEvent.findMany.mockResolvedValue([
      { ...mockEvents[1], metadata: null },
    ]);
    mockFetch.mockReset().mockResolvedValueOnce(okResponse(""));

    const result = await fullExportSync();
    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.failed).toBe(0);
  });

  it("prepends slash to appleEventId during full sync update", async () => {
    // Event with appleEventId that doesn't start with "/"
    mockPrisma.calendarEvent.findMany.mockResolvedValue([
      {
        ...mockEvents[0],
        metadata: { appleEventId: "calendars/abc-123/no-slash.ics" },
      },
    ]);
    mockFetch.mockReset().mockResolvedValueOnce(okResponse(""));

    const result = await fullExportSync();
    expect(result.updated).toBe(1);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://caldav.icloud.com/calendars/abc-123/no-slash.ics",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// ─── getIntegrationStatus ────────────────────────────────────────────────────

describe("getIntegrationStatus", () => {
  it("returns connected status when integration exists", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      id: "int-1",
      provider: "APPLE",
      email: "test@icloud.com",
      calendarName: "My Calendar",
      syncEnabled: true,
      lastSyncedAt: new Date("2026-07-10T12:00:00Z"),
    });

    const status = await getIntegrationStatus();

    expect(status).toEqual({
      connected: true,
      email: "test@icloud.com",
      calendarName: "My Calendar",
      lastSyncedAt: "2026-07-10T12:00:00.000Z",
      syncEnabled: true,
    });
  });

  it("returns disconnected when no integration exists", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);

    const status = await getIntegrationStatus();
    expect(status).toEqual({ connected: false, syncEnabled: false });
  });

  it("returns disconnected when findFirst throws", async () => {
    mockPrisma.calendarIntegration.findFirst.mockRejectedValue(new Error("DB error"));

    const status = await getIntegrationStatus();
    expect(status).toEqual({ connected: false, syncEnabled: false });
  });

  it("handles null lastSyncedAt", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      id: "int-1",
      provider: "APPLE",
      email: "test@icloud.com",
      calendarName: "My Calendar",
      syncEnabled: true,
      lastSyncedAt: null,
    });

    const status = await getIntegrationStatus();
    expect(status.lastSyncedAt).toBeNull();
  });
});
