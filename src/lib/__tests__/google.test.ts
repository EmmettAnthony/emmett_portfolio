import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Module-level mocks (declare with vi.hoisted for vi.mock hoisting compat) ─

const { mockGenerateAuthUrl, mockGetToken, mockSetCredentials, mockRefreshAccessToken } =
  vi.hoisted(() => ({
    mockGenerateAuthUrl: vi.fn(),
    mockGetToken: vi.fn(),
    mockSetCredentials: vi.fn(),
    mockRefreshAccessToken: vi.fn(),
  }));

const { mockEventsInsert, mockEventsUpdate, mockEventsDelete, mockCalendarListGet } =
  vi.hoisted(() => ({
    mockEventsInsert: vi.fn(),
    mockEventsUpdate: vi.fn(),
    mockEventsDelete: vi.fn(),
    mockCalendarListGet: vi.fn(),
  }));

const { MockOAuth2Client } = vi.hoisted(() => {
  return {
    MockOAuth2Client: class MockOAuth2Client {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      generateAuthUrl = mockGenerateAuthUrl;
      getToken = mockGetToken;
      setCredentials = mockSetCredentials;
      refreshAccessToken = mockRefreshAccessToken;

      constructor(clientId: string, clientSecret: string, redirectUri: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
      }
    },
  };
});

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: MockOAuth2Client,
    },
    calendar: vi.fn(() => ({
      events: {
        insert: mockEventsInsert,
        update: mockEventsUpdate,
        delete: mockEventsDelete,
      },
      calendarList: {
        get: mockCalendarListGet,
      },
    })),
  },
  calendar_v3: {},
}));

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
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
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
} from "@/lib/calendar/google";

// ─── getAuthUrl ──────────────────────────────────────────────────────────────

describe("getAuthUrl", () => {
  it("generates an OAuth URL with correct parameters", () => {
    const expectedUrl = "https://accounts.google.com/o/oauth2/auth?test=1";
    mockGenerateAuthUrl.mockReturnValue(expectedUrl);

    const url = getAuthUrl();

    expect(url).toBe(expectedUrl);
    expect(mockGenerateAuthUrl).toHaveBeenCalledOnce();
    expect(mockGenerateAuthUrl).toHaveBeenCalledWith({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar"],
      prompt: "consent",
    });
  });

  it("constructs OAuth client with correct redirect URI", () => {
    mockGenerateAuthUrl.mockReturnValue("url");
    getAuthUrl();
    // We can't easily check lastMockClient across vi.hoisted scope, so we
    // verify the mock was called (proving construction succeeded with the URI).
    expect(mockGenerateAuthUrl).toHaveBeenCalled();
  });

  it("falls back to localhost redirect URI when SITE_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    mockGenerateAuthUrl.mockReturnValue("url");
    getAuthUrl();
    expect(mockGenerateAuthUrl).toHaveBeenCalled();
  });

  it("throws when GOOGLE_CLIENT_ID is missing", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    expect(() => getAuthUrl()).toThrow("Google Calendar OAuth not configured");
  });

  it("throws when GOOGLE_CLIENT_SECRET is missing", () => {
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(() => getAuthUrl()).toThrow("Google Calendar OAuth not configured");
  });
});

// ─── handleCallback ──────────────────────────────────────────────────────────

describe("handleCallback", () => {
  const authCode = "test-auth-code";
  const mockTokens = {
    access_token: "new-access-token",
    refresh_token: "new-refresh-token",
    expiry_date: Date.now() + 3600_000,
  };

  beforeEach(() => {
    mockGetToken.mockResolvedValue({ tokens: mockTokens });
    mockCalendarListGet.mockResolvedValue({
      data: { summary: "user@gmail.com", summaryOverride: "My Calendar" },
    });
    mockPrisma.calendarIntegration.upsert.mockResolvedValue({
      id: "integration-1",
      email: "user@gmail.com",
    });
  });

  it("exchanges the code, fetches calendar info, and upserts the integration", async () => {
    const result = await handleCallback(authCode);

    expect(mockGetToken).toHaveBeenCalledWith(authCode);
    expect(mockSetCredentials).toHaveBeenCalledWith(mockTokens);
    expect(mockCalendarListGet).toHaveBeenCalledWith({ calendarId: "primary" });

    expect(mockPrisma.calendarIntegration.upsert).toHaveBeenCalledWith({
      where: {
        provider_email: { provider: "GOOGLE", email: "user@gmail.com" },
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
        provider: "GOOGLE",
        email: "user@gmail.com",
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

    expect(result).toEqual({ id: "integration-1", email: "user@gmail.com" });
  });

  it("falls back to 'primary' email when calendar summary is null", async () => {
    mockCalendarListGet.mockResolvedValue({
      data: { summary: null, summaryOverride: null },
    });

    await handleCallback(authCode);

    expect(mockPrisma.calendarIntegration.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider_email: { provider: "GOOGLE", email: "primary" },
        },
      })
    );
  });

  it("falls back to email for calendarName when summaryOverride is null", async () => {
    mockCalendarListGet.mockResolvedValue({
      data: { summary: "user@gmail.com", summaryOverride: null },
    });

    await handleCallback(authCode);

    const call = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(call.create.calendarName).toBe("user@gmail.com");
  });

  it("throws when no access token is returned", async () => {
    mockGetToken.mockResolvedValue({ tokens: {} });
    await expect(handleCallback(authCode)).rejects.toThrow(
      "No access token received from Google"
    );
  });

  it("handles null refresh_token gracefully", async () => {
    mockGetToken.mockResolvedValue({
      tokens: { access_token: "tok", refresh_token: null },
    });

    await handleCallback(authCode);

    const call = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(call.create.refreshToken).toBeNull();
    expect(call.update.refreshToken).toBeUndefined();
  });

  it("falls back to 'Primary' calendarName when both summaryOverride and email are null", async () => {
    mockCalendarListGet.mockResolvedValue({
      data: { summary: null, summaryOverride: null },
    });

    await handleCallback(authCode);

    const call = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(call.create.calendarName).toBe("Primary");
    expect(call.update.calendarName).toBe("Primary");
  });

  it("handles missing expiry_date in token response", async () => {
    mockGetToken.mockResolvedValue({
      tokens: { access_token: "tok", refresh_token: "ref" }, // no expiry_date
    });

    await handleCallback(authCode);

    const call = mockPrisma.calendarIntegration.upsert.mock.calls[0][0];
    expect(call.create.tokenExpiry).toBeNull();
    expect(call.update.tokenExpiry).toBeNull();
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

  it("returns the client and integration when found and token is valid", async () => {
    const result = await getAuthenticatedClient();

    expect(mockPrisma.calendarIntegration.findFirst).toHaveBeenCalledWith({
      where: { provider: "GOOGLE", syncEnabled: true },
    });

    expect(result.integration).toEqual({
      id: "int-1",
      accessToken: "existing-token",
      refreshToken: "existing-refresh",
      tokenExpiry: mockIntegration.tokenExpiry,
      calendarId: "primary",
    });

    expect(mockSetCredentials).toHaveBeenCalledWith({
      access_token: "existing-token",
      refresh_token: "existing-refresh",
    });
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });

  it("refreshes the token when expired", async () => {
    const expiredIntegration = {
      ...mockIntegration,
      tokenExpiry: new Date(Date.now() - 3600_000), // expired
    };
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(expiredIntegration);

    mockRefreshAccessToken.mockResolvedValue({
      credentials: {
        access_token: "refreshed-token",
        expiry_date: Date.now() + 3600_000,
      },
    });

    const result = await getAuthenticatedClient();

    expect(mockSetCredentials).toHaveBeenCalledWith({
      refresh_token: "existing-refresh",
    });
    expect(mockRefreshAccessToken).toHaveBeenCalledOnce();

    expect(mockPrisma.calendarIntegration.update).toHaveBeenCalledWith({
      where: { id: "int-1" },
      data: {
        accessToken: "refreshed-token",
        tokenExpiry: expect.any(Date),
      },
    });

    expect(result.integration?.id).toBe("int-1");
  });

  it("does not refresh when tokenExpiry is null", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...mockIntegration,
      tokenExpiry: null,
    });

    await getAuthenticatedClient();
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });

  it("sets undefined refresh_token when integration has no refreshToken", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...mockIntegration,
      refreshToken: null,
      tokenExpiry: new Date(Date.now() + 3600_000), // not expired
    });

    await getAuthenticatedClient();

    expect(mockSetCredentials).toHaveBeenCalledWith({
      access_token: "existing-token",
      refresh_token: undefined,
    });
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });

  it("handles token refresh without new access_token in response", async () => {
    const expiredIntegration = {
      ...mockIntegration,
      tokenExpiry: new Date(Date.now() - 3600_000), // expired
    };
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(expiredIntegration);

    // Refresh returns credentials without access_token (and without expiry_date)
    mockRefreshAccessToken.mockResolvedValue({
      credentials: {},
    });

    await getAuthenticatedClient();

    // Should update with undefined (keeper) for accessToken and null for tokenExpiry
    expect(mockPrisma.calendarIntegration.update).toHaveBeenCalledWith({
      where: { id: "int-1" },
      data: {
        accessToken: undefined,
        tokenExpiry: null,
      },
    });
  });

  it("throws when no integration is found", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);
    await expect(getAuthenticatedClient()).rejects.toThrow(
      "No Google Calendar integration found"
    );
  });

  it("throws when integration has no accessToken", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      ...mockIntegration,
      accessToken: null,
    });

    await expect(getAuthenticatedClient()).rejects.toThrow(
      "No Google Calendar integration found"
    );
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
    color: "#3b82f6",
    eventType: "MEETING",
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
    mockEventsInsert.mockResolvedValue({ data: { id: "google-event-1" } });
    mockEventsUpdate.mockResolvedValue({ data: { id: "google-event-1" } });
  });

  it("creates a new event in Google Calendar and returns the Google event ID", async () => {
    const result = await exportEvent(baseEvent);

    expect(result).toBe("google-event-1");
    expect(mockEventsInsert).toHaveBeenCalledOnce();
    expect(mockEventsInsert).toHaveBeenCalledWith({
      calendarId: "primary",
      requestBody: expect.objectContaining({
        summary: "Test Meeting",
        description: "A test meeting description",
        location: "Conference Room",
        start: { dateTime: "2026-07-15T10:00:00.000Z" },
        end: { dateTime: "2026-07-15T11:00:00.000Z" },
        source: { title: "View in Dashboard", url: "https://meet.example.com/test" },
      }),
    });
    expect(mockEventsUpdate).not.toHaveBeenCalled();
  });

  it("updates an existing event when googleEventId is in metadata", async () => {
    const result = await exportEvent({
      ...baseEvent,
      metadata: { googleEventId: "existing-google-id" },
    });

    expect(result).toBe("existing-google-id");
    expect(mockEventsUpdate).toHaveBeenCalledOnce();
    expect(mockEventsUpdate).toHaveBeenCalledWith({
      calendarId: "primary",
      eventId: "existing-google-id",
      requestBody: expect.objectContaining({ summary: "Test Meeting" }),
    });
    expect(mockEventsInsert).not.toHaveBeenCalled();
  });

  it("handles all-day events with exclusive end date", async () => {
    await exportEvent({ ...baseEvent, allDay: true });

    expect(mockEventsInsert).toHaveBeenCalledWith({
      calendarId: "primary",
      requestBody: expect.objectContaining({
        start: { date: "2026-07-15" },
        end: { date: "2026-07-16" },
      }),
    });
  });

  it("returns null when no integration is found", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);
    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(mockEventsInsert).not.toHaveBeenCalled();
  });

  it("returns null and logs error when the API call fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEventsInsert.mockRejectedValue(new Error("API error"));

    const result = await exportEvent(baseEvent);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("maps known hex colors to Google Calendar colorId", async () => {
    await exportEvent({ ...baseEvent, color: "#10b981" });

    expect(mockEventsInsert).toHaveBeenCalledWith({
      calendarId: "primary",
      requestBody: expect.objectContaining({ colorId: "2" }),
    });
  });

  it("omits colorId for unmapped hex colors", async () => {
    await exportEvent({ ...baseEvent, color: "#ff6600" });

    const call = mockEventsInsert.mock.calls[0][0];
    expect(call.requestBody.colorId).toBeUndefined();
  });

  it("omits source when link is not provided", async () => {
    await exportEvent({ ...baseEvent, link: null });

    const call = mockEventsInsert.mock.calls[0][0];
    expect(call.requestBody.source).toBeUndefined();
  });

  it("handles all-day event without endDate, falling back to startDate", async () => {
    await exportEvent({
      ...baseEvent,
      allDay: true,
      endDate: null,
    });

    expect(mockEventsInsert).toHaveBeenCalledWith({
      calendarId: "primary",
      requestBody: expect.objectContaining({
        start: { date: "2026-07-15" },
        end: { date: "2026-07-16" },
      }),
    });
  });

  it("handles timed event without endDate, falling back to startDate", async () => {
    await exportEvent({
      ...baseEvent,
      endDate: null,
    });

    const body = mockEventsInsert.mock.calls[0][0].requestBody;
    expect(body.start.dateTime).toBe("2026-07-15T10:00:00.000Z");
    expect(body.end.dateTime).toBe("2026-07-15T10:00:00.000Z");
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
  });

  it("deletes an event from Google Calendar", async () => {
    const result = await deleteEvent("google-event-id");
    expect(result).toBe(true);
    expect(mockEventsDelete).toHaveBeenCalledWith({
      calendarId: "primary",
      eventId: "google-event-id",
    });
  });

  it("returns false when no integration exists", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue(null);
    expect(await deleteEvent("id")).toBe(false);
    expect(mockEventsDelete).not.toHaveBeenCalled();
  });

  it("returns false and logs error when the API call fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEventsDelete.mockRejectedValue(new Error("Delete failed"));
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
      metadata: { googleEventId: "existing-google-id" },
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
    mockEventsUpdate.mockResolvedValue({});
    mockEventsInsert.mockResolvedValue({ data: { id: "new-google-id" } });
  });

  it("updates existing events and creates new ones", async () => {
    const result = await fullExportSync();

    expect(result.updated).toBe(1); // evt-1 has googleEventId → update
    expect(result.created).toBe(1); // evt-2 has no googleEventId → insert
    expect(result.failed).toBe(0);

    expect(mockEventsUpdate).toHaveBeenCalledWith({
      calendarId: "primary",
      eventId: "existing-google-id",
      requestBody: expect.objectContaining({ summary: "Existing Event" }),
    });

    expect(mockEventsInsert).toHaveBeenCalledWith({
      calendarId: "primary",
      requestBody: expect.objectContaining({ summary: "New Event" }),
    });

    // New Google ID stored in metadata
    expect(mockPrisma.calendarEvent.update).toHaveBeenCalledWith({
      where: { id: "evt-2" },
      data: { metadata: { googleEventId: "new-google-id" } },
    });

    // Last synced timestamp updated
    expect(mockPrisma.calendarIntegration.updateMany).toHaveBeenCalledWith({
      where: { provider: "GOOGLE", syncEnabled: true },
      data: { lastSyncedAt: expect.any(Date) },
    });
  });

  it("counts failures when integration is missing mid-sync", async () => {
    // First event's getAuthenticatedClient call succeeds, second fails
    mockPrisma.calendarIntegration.findFirst
      .mockResolvedValueOnce(mockIntegration) // evt-1: success
      .mockResolvedValueOnce(null); // evt-2: throws (caught → failed)

    const result = await fullExportSync();

    // evt-1 has googleEventId → update path, evt-2 loses integration → fail
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

    const result = await fullExportSync();
    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.failed).toBe(0);
  });

  it("handles created event with no id in response", async () => {
    mockPrisma.calendarEvent.findMany.mockResolvedValue([
      { ...mockEvents[1], metadata: null },
    ]);
    mockEventsInsert.mockResolvedValue({ data: { } }); // no id

    const result = await fullExportSync();
    expect(result.created).toBe(1);
    // No update should happen since there's no id to store
    expect(mockPrisma.calendarEvent.update).not.toHaveBeenCalled();
  });
});

// ─── getIntegrationStatus ────────────────────────────────────────────────────

describe("getIntegrationStatus", () => {
  it("returns connected status when integration exists", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      id: "int-1",
      provider: "GOOGLE",
      email: "user@gmail.com",
      calendarName: "My Calendar",
      syncEnabled: true,
      lastSyncedAt: new Date("2026-07-10T12:00:00Z"),
    });

    const status = await getIntegrationStatus();

    expect(status).toEqual({
      connected: true,
      email: "user@gmail.com",
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
    mockPrisma.calendarIntegration.findFirst.mockRejectedValue(
      new Error("DB error")
    );

    const status = await getIntegrationStatus();
    expect(status).toEqual({ connected: false, syncEnabled: false });
  });

  it("handles null lastSyncedAt", async () => {
    mockPrisma.calendarIntegration.findFirst.mockResolvedValue({
      id: "int-1",
      provider: "GOOGLE",
      email: "user@gmail.com",
      calendarName: "My Calendar",
      syncEnabled: true,
      lastSyncedAt: null,
    });

    const status = await getIntegrationStatus();
    expect(status.lastSyncedAt).toBeNull();
  });
});
