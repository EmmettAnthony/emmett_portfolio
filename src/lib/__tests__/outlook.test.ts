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
  process.env.OUTLOOK_CLIENT_ID = "test-outlook-client-id";
  process.env.OUTLOOK_CLIENT_SECRET = "test-outlook-client-secret";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

  vi.clearAllMocks();
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

import {
  getAuthUrl,
  handleCallback,
  getAuthenticatedClient,
  exportEvent,
  deleteEvent,
  fullExportSync,
  getIntegrationStatus,
} from "@/lib/calendar/outlook";

// Helper to create a mock ok fetch response
function okJson(data: unknown): Response {
  return { ok: true, status: 200, json: () => Promise.resolve(data), text: () => Promise.resolve(JSON.stringify(data)) } as Response;
}

function failFetch(status: number, body: string): Response {
  return { ok: false, status, text: () => Promise.resolve(body), json: () => Promise.reject(new Error("Not JSON")) } as Response;
}

// ─── getAuthUrl ──────────────────────────────────────────────────────────────

describe("getAuthUrl", () => {
  it("generates a Microsoft OAuth URL with correct parameters", () => {
    const url = getAuthUrl();

    expect(url).toContain("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    expect(url).toContain("client_id=test-outlook-client-id");
    expect(url).toContain("response_type=code");
    expect(url).toContain("redirect_uri=");
    expect(url).toContain(encodeURIComponent("http://localhost:3000/api/calendar/integrations/outlook/callback"));
    expect(url).toContain("scope=Calendars.ReadWrite+offline_access+User.Read");
    expect(url).toContain("response_mode=query");
    expect(url).toContain("prompt=consent");
  });

  it("uses the production SITE_URL for the redirect URI", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://emmettanthony.dev";
    const url = getAuthUrl();

    expect(url).toContain(encodeURIComponent("https://emmettanthony.dev/api/calendar/integrations/outlook/callback"));
  });

  it("falls back to localhost when SITE_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const url = getAuthUrl();

    expect(url).toContain(encodeURIComponent("http://localhost:3000/api/calendar/integrations/outlook/callback"));
  });

  it("throws when OUTLOOK_CLIENT_ID is missing", () => {
    delete process.env.OUTLOOK_CLIENT_ID;
    expect(() => getAuthUrl()).toThrow("Outlook Calendar OAuth not configured");
  });

  it("throws when OUTLOOK_CLIENT_SECRET is missing", () => {
    delete process.env.OUTLOOK_CLIENT_SECRET;
    expect(() => getAuthUrl()).toThrow("Outlook Calendar OAuth not configured");
  });
});

// ─── handleCallback ──────────────────────────────────────────────────────────

describe("handleCallback", () => {
  const authCode = "test-auth-code";

  const mockTokenResponse = {
    access_token: "new-access-token",
    refresh_token: "new-refresh-token",
    expires_in: 3600,
  };

  const mockUserResponse = {
    mail: "user@outlook.com",
    userPrincipalName: "user@outlook.com",
    displayName: "User",
  };

  const mockCalendarResponse = {
    name: "My Calendar",
  };

  beforeEach(() => {
    // First fetch call: token exchange
    // Second fetch call: /me user info
    // Third fetch call: /me/calendar info
    mockFetch
      .mockResolvedValueOnce(okJson(mockTokenResponse))
      .mockResolvedValueOnce(okJson(mockUserResponse))
      .mockResolvedValueOnce(okJson(mockCalendarResponse));

    mockPrisma.calendarIntegration.upsert.mockResolvedValue({
      id: "integration-1",
      email: "user@outlook.com",
    });
  });

  it("exchanges the code, fetches user/calendar info, and upserts the integration", async () => {
    const result = await handleCallback(authCode);

    // Token exchange call
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );
    // Verify the body contains the code and grant_type
    const tokenCallBody = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    expect(tokenCallBody).toContain("code=" + authCode);
    expect(tokenCallBody).toContain("grant_type=authorization_code");
    expect(tokenCallBody).toContain("client_id=test-outlook-client-id");

    // User info call
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://graph.microsoft.com/v1.0/me",
      expect.objectContaining({
        headers: { Authorization: "Bearer new-access-token" },
      })
    );

    // Calendar info call
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      "https://graph.microsoft.com/v1.0/me/calendar",
      expect.objectContaining({
        headers: { Authorization: "Bearer new-access-token" },
      })
    );

    // Integration upserted
    expect(mockPrisma.calendarIntegration.upsert).toHaveBeenCalledWith({
      where: {
        provider_email: { provider: "OUTLOOK", email: "user@outlook.com" },
      },
      update: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        tokenExpiry: expect.any(Date),
        calendarId: "primary",
        calendarName: "My Calendar",
        syncEnabled: true,
        lastSyncedAt: expect.any(Date),
      },
      create: {
        provider: "OUTLOOK",
        email: "user@outlook.com",
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        tokenExpiry: expect.any(Date),
        calendarId: "primary",
        calendarName: "My Calendar",
        syncEnabled: true,
        syncDirection: "EXPORT",
        lastSyncedAt: expect.any(Date),
      },
    });

    expect(result).toEqual({ id: "integration-1", email: "user@outlook.com" });
  });

  it("falls back to userPrincipalName when mail is null", async () => {
    mockFetch
      .mockReset()
      .mockResolvedValueOnce(okJson(mockTokenResponse))
      .mockResolvedValueOnce(okJson({ ...mockUserResponse, mail: null, userPrincipalName: "alt@outlook.com" }))
      .mockResolvedValueOnce(okJson(mockCalendarResponse));

    await handleCallback(authCode);

    const upsertCall = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(upsertCall.where.provider_email.email).toBe("alt@outlook.com");
  });

  it("falls back to 'primary' when both mail and userPrincipalName are null", async () => {
    mockFetch
      .mockReset()
      .mockResolvedValueOnce(okJson(mockTokenResponse))
      .mockResolvedValueOnce(okJson({ ...mockUserResponse, mail: null, userPrincipalName: null }))
      .mockResolvedValueOnce(okJson(mockCalendarResponse));

    await handleCallback(authCode);

    const upsertCall = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(upsertCall.where.provider_email.email).toBe("primary");
  });

  it("falls back to email for calendarName when calendar fetch fails", async () => {
    mockFetch
      .mockReset()
      .mockResolvedValueOnce(okJson(mockTokenResponse))
      .mockResolvedValueOnce(okJson(mockUserResponse))
      .mockResolvedValueOnce(failFetch(403, "Forbidden")); // calendar fetch fails

    await handleCallback(authCode);

    const upsertCall = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(upsertCall.create.calendarName).toBe("user@outlook.com");
  });

  it("throws when token exchange fails", async () => {
    mockFetch.mockReset().mockResolvedValueOnce(failFetch(400, "invalid_grant"));

    await expect(handleCallback(authCode)).rejects.toThrow("Token exchange failed");
  });

  it("throws when no access token is returned", async () => {
    mockFetch.mockReset().mockResolvedValueOnce(okJson({ expires_in: 3600 })); // no access_token

    await expect(handleCallback(authCode)).rejects.toThrow("No access token received from Outlook");
  });

  it("throws when user info fetch fails", async () => {
    mockFetch
      .mockReset()
      .mockResolvedValueOnce(okJson(mockTokenResponse))
      .mockResolvedValueOnce(failFetch(401, "Unauthorized"));

    await expect(handleCallback(authCode)).rejects.toThrow("Failed to fetch user info from Microsoft Graph");
  });

  it("handles null refresh_token gracefully", async () => {
    mockFetch
      .mockReset()
      .mockResolvedValueOnce(okJson({ ...mockTokenResponse, refresh_token: null }))
      .mockResolvedValueOnce(okJson(mockUserResponse))
      .mockResolvedValueOnce(okJson(mockCalendarResponse));

    await handleCallback(authCode);

    const upsertCall = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(upsertCall.create.refreshToken).toBeNull();
    expect(upsertCall.update.refreshToken).toBeUndefined();
  });

  it("uses default expiry when token response has no expires_in", async () => {
    mockFetch
      .mockReset()
      .mockResolvedValueOnce(okJson({ access_token: "tok", refresh_token: "ref" })) // no expires_in
      .mockResolvedValueOnce(okJson(mockUserResponse))
      .mockResolvedValueOnce(okJson(mockCalendarResponse));

    await handleCallback(authCode);

    const upsertCall = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    // Default expiry: 3600 seconds from now
    expect(upsertCall.update.tokenExpiry).toBeInstanceOf(Date);
    const now = Date.now();
    const diff = upsertCall.update.tokenExpiry.getTime() - now;
    expect(diff).toBeGreaterThan(3500 * 1000); // ~1 hour (within tolerance)
    expect(diff).toBeLessThan(3700 * 1000);
  });

  it("falls back to 'Outlook Calendar' when both calendarName and email are null", async () => {
    mockFetch
      .mockReset()
      .mockResolvedValueOnce(okJson({ ...mockTokenResponse, refresh_token: null }))
      .mockResolvedValueOnce(okJson({ mail: null, userPrincipalName: null }))
      .mockResolvedValueOnce(failFetch(403, "Forbidden")); // calendar fetch fails

    await handleCallback(authCode);

    const upsertCall = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(upsertCall.create.calendarName).toBe("Outlook Calendar");
  });
});

// ─── getAuthenticatedClient ──────────────────────────────────────────────────

describe("getAuthenticatedClient", () => {
  const mockIntegration = {
    id: "int-1",
    accessToken: "existing-token",
    refreshToken: "existing-refresh",
    tokenExpiry: new Date(Date.now() + 3600_000), // not expired
    calendarId: "primary",
    syncEnabled: true,
  };

  beforeEach(() => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(mockIntegration);
  });

  it("returns the access token and integration when found and token is valid", async () => {
    const result = await getAuthenticatedClient();

    expect(mockPrisma.calendarIntegration.findFirst).toHaveBeenCalledWith({
      where: { provider: "OUTLOOK", syncEnabled: true },
    });

    expect(result.accessToken).toBe("existing-token");
    expect(result.integration).toEqual({
      id: "int-1",
      accessToken: "existing-token",
      refreshToken: "existing-refresh",
      tokenExpiry: mockIntegration.tokenExpiry,
      calendarId: "primary",
    });

    // Should NOT have tried to refresh
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refreshes the token when expired", async () => {
    const expiredIntegration = {
      ...mockIntegration,
      tokenExpiry: new Date(Date.now() - 3600_000), // expired
    };
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(expiredIntegration);

    mockFetch.mockResolvedValueOnce(okJson({
      access_token: "refreshed-token",
      expires_in: 3600,
    }));

    const result = await getAuthenticatedClient();

    // Should have called the token refresh endpoint
    expect(mockFetch).toHaveBeenCalledOnce();
    const refreshUrl = mockFetch.mock.calls[0][0];
    expect(refreshUrl).toBe("https://login.microsoftonline.com/common/oauth2/v2.0/token");
    const refreshBody = (mockFetch.mock.calls[0][1] as RequestInit).body as string;
    expect(refreshBody).toContain("grant_type=refresh_token");
    expect(refreshBody).toContain("refresh_token=existing-refresh");

    // Should have updated the stored tokens
    expect(mockPrisma.calendarIntegration.update).toHaveBeenCalledWith({
      where: { id: "int-1" },
      data: {
        accessToken: "refreshed-token",
        tokenExpiry: expect.any(Date),
      },
    });

    expect(result.accessToken).toBe("refreshed-token");
  });

  it("does not refresh when tokenExpiry is null", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...mockIntegration,
      tokenExpiry: null,
    });

    await getAuthenticatedClient();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uses existing accessToken when token is valid but no refreshToken", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...mockIntegration,
      refreshToken: null,
      tokenExpiry: new Date(Date.now() + 3600_000), // not expired
    });

    const result = await getAuthenticatedClient();
    expect(result.accessToken).toBe("existing-token");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when no integration is found", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);
    await expect(getAuthenticatedClient()).rejects.toThrow(
      "No Outlook Calendar integration found"
    );
  });

  it("throws when integration has no accessToken", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...mockIntegration,
      accessToken: null,
    });

    await expect(getAuthenticatedClient()).rejects.toThrow(
      "No Outlook Calendar integration found"
    );
  });

  it("throws when token refresh fails", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...mockIntegration,
      tokenExpiry: new Date(Date.now() - 3600_000),
    });
    mockFetch.mockResolvedValueOnce(failFetch(400, "invalid_grant"));

    await expect(getAuthenticatedClient()).rejects.toThrow("Token refresh failed");
  });

  it("uses default expires_in when refresh response omits it", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...mockIntegration,
      tokenExpiry: new Date(Date.now() - 3600_000),
    });
    // Refresh response without expires_in
    mockFetch.mockResolvedValueOnce(okJson({ access_token: "refreshed-token" }));

    const result = await getAuthenticatedClient();

    // Should have updated with a default expiry (~3600s from now)
    expect(mockPrisma.calendarIntegration.update).toHaveBeenCalledWith({
      where: { id: "int-1" },
      data: {
        accessToken: "refreshed-token",
        tokenExpiry: expect.any(Date),
      },
    });
    const newExpiry = mockPrisma.calendarIntegration.update.mock.calls[0][0].data.tokenExpiry;
    const diff = newExpiry.getTime() - Date.now();
    expect(diff).toBeGreaterThan(3500 * 1000);
    expect(diff).toBeLessThan(3700 * 1000);
    expect(result.accessToken).toBe("refreshed-token");
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
    link: "https://meet.example.com/test",
  };

  const mockIntegration = {
    id: "int-1",
    accessToken: "tok",
    refreshToken: "refresh",
    tokenExpiry: new Date(Date.now() + 3600_000),
    calendarId: "primary",
    syncEnabled: true,
  };

  beforeEach(() => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(mockIntegration);
    mockFetch.mockResolvedValue(okJson({ id: "outlook-event-1" }));
  });

  it("creates a new event in Outlook Calendar and returns the event ID", async () => {
    const result = await exportEvent(baseEvent);

    expect(result).toBe("outlook-event-1");
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/me/events",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer tok",
          "Content-Type": "application/json",
        }),
      })
    );

    // Verify the event body
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.subject).toBe("Test Meeting");
    expect(body.body.content).toBe("A test meeting description");
    expect(body.location.displayName).toBe("Conference Room");
    expect(body.start.dateTime).toBe("2026-07-15T10:00:00.000Z");
    expect(body.end.dateTime).toBe("2026-07-15T11:00:00.000Z");
  });

  it("updates an existing event when outlookEventId is in metadata", async () => {
    const result = await exportEvent({
      ...baseEvent,
      metadata: { outlookEventId: "existing-outlook-id" },
    });

    expect(result).toBe("existing-outlook-id");
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/me/events/existing-outlook-id",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("handles all-day events with timeZone", async () => {
    await exportEvent({ ...baseEvent, allDay: true });

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.isAllDay).toBe(true);
    expect(body.start.dateTime).toBe("2026-07-15");
    expect(body.end.dateTime).toBe("2026-07-16");
    expect(body.start.timeZone).toBe("UTC");
  });

  it("omits body when description is null", async () => {
    await exportEvent({ ...baseEvent, description: null });

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.body).toBeUndefined();
  });

  it("omits location when not provided", async () => {
    await exportEvent({ ...baseEvent, location: null });

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.location).toBeUndefined();
  });

  it("returns null when no integration is found", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);
    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles non-allDay event with null endDate", async () => {
    await exportEvent({ ...baseEvent, endDate: null });

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    // Should fall back to startDate for endDate
    expect(body.end.dateTime).toBe("2026-07-15T10:00:00.000Z");
  });

  it("returns null and logs error when the API call fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("Graph API error"));

    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles Graph API non-ok response via graphFetch error path", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValue(failFetch(403, "Forbidden"));

    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to export event to Outlook Calendar:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it("handles all-day event without endDate, falling back to startDate", async () => {
    await exportEvent({
      ...baseEvent,
      allDay: true,
      endDate: null,
    });

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.isAllDay).toBe(true);
    expect(body.start.dateTime).toBe("2026-07-15");
    expect(body.end.dateTime).toBe("2026-07-16");
    expect(body.start.timeZone).toBe("UTC");
  });
});

// ─── deleteEvent ─────────────────────────────────────────────────────────────

describe("deleteEvent", () => {
  const mockIntegration = {
    id: "int-1",
    accessToken: "tok",
    refreshToken: "refresh",
    tokenExpiry: new Date(Date.now() + 3600_000),
    calendarId: "primary",
    syncEnabled: true,
  };

  beforeEach(() => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(mockIntegration);
    mockFetch.mockResolvedValue(okJson({}));
  });

  it("deletes an event from Outlook Calendar", async () => {
    const result = await deleteEvent("outlook-event-id");

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/me/events/outlook-event-id",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("returns false when no integration exists", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);
    expect(await deleteEvent("id")).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns false and logs error when the API call fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("Graph API error"));

    expect(await deleteEvent("id")).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ─── fullExportSync ──────────────────────────────────────────────────────────

describe("fullExportSync", () => {
  const mockIntegration = {
    id: "int-1",
    accessToken: "tok",
    refreshToken: "refresh",
    tokenExpiry: new Date(Date.now() + 3600_000),
    calendarId: "primary",
    syncEnabled: true,
  };

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
      color: "#ef4444",
      eventType: "MEETING",
      metadata: { outlookEventId: "existing-outlook-id" },
    },
    {
      id: "evt-2",
      title: "New Event",
      description: "Brand new",
      startDate: new Date("2026-07-11T09:00:00Z"),
      endDate: new Date("2026-07-11T10:00:00Z"),
      allDay: false,
      location: "Office",
      link: null,
      color: "#10b981",
      eventType: "CONSULTATION",
      metadata: null,
    },
  ];

  beforeEach(() => {
    mockPrisma.calendarEvent.findMany.mockResolvedValue(mockEvents);
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(mockIntegration);

    // For two events: first update, second create
    mockFetch
      .mockResolvedValueOnce(okJson({})) // PATCH evt-1
      .mockResolvedValueOnce(okJson({ id: "new-outlook-id" })); // POST evt-2
  });

  it("updates existing events and creates new ones", async () => {
    const result = await fullExportSync();

    expect(result.updated).toBe(1);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(0);

    // PATCH for evt-1 (has outlookEventId)
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://graph.microsoft.com/v1.0/me/events/existing-outlook-id",
      expect.objectContaining({ method: "PATCH" })
    );

    // POST for evt-2 (no outlookEventId)
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://graph.microsoft.com/v1.0/me/events",
      expect.objectContaining({ method: "POST" })
    );

    // New Outlook ID stored in metadata
    expect(mockPrisma.calendarEvent.update).toHaveBeenCalledWith({
      where: { id: "evt-2" },
      data: { metadata: { outlookEventId: "new-outlook-id" } },
    });

    // Last synced timestamp updated
    expect(mockPrisma.calendarIntegration.updateMany).toHaveBeenCalledWith({
      where: { provider: "OUTLOOK", syncEnabled: true },
      data: { lastSyncedAt: expect.any(Date) },
    });
  });

  it("counts failures when token refresh fails mid-sync", async () => {
    mockPrisma.calendarIntegration.findFirst
      .mockReset()
      .mockResolvedValueOnce(mockIntegration) // first call: evt-1 succeeds
      .mockResolvedValueOnce(null); // second call: evt-2 fails

    const result = await fullExportSync();

    expect(result.updated).toBe(1);
    expect(result.failed).toBe(1);
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
    mockFetch.mockReset().mockResolvedValueOnce(okJson({ id: "new-id" }));

    const result = await fullExportSync();
    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.failed).toBe(0);
  });

  it("handles created event with no id in response during full sync", async () => {
    mockPrisma.calendarEvent.findMany.mockResolvedValue([
      { ...mockEvents[1], metadata: null },
    ]);
    mockFetch.mockReset().mockResolvedValueOnce(okJson({ })); // no id

    const result = await fullExportSync();
    expect(result.created).toBe(1);
    // Should not try to update metadata with a null id
    expect(mockPrisma.calendarEvent.update).not.toHaveBeenCalled();
  });
});

// ─── getIntegrationStatus ────────────────────────────────────────────────────

describe("getIntegrationStatus", () => {
  it("returns connected status when integration exists", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      id: "int-1",
      provider: "OUTLOOK",
      email: "user@outlook.com",
      calendarName: "My Calendar",
      syncEnabled: true,
      lastSyncedAt: new Date("2026-07-10T12:00:00Z"),
    });

    const status = await getIntegrationStatus();

    expect(status).toEqual({
      connected: true,
      email: "user@outlook.com",
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
      provider: "OUTLOOK",
      email: "user@outlook.com",
      calendarName: "My Calendar",
      syncEnabled: true,
      lastSyncedAt: null,
    });

    const status = await getIntegrationStatus();
    expect(status.lastSyncedAt).toBeNull();
  });
});
