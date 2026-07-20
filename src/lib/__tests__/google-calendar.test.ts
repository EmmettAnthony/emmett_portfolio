import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGoogleAuth = vi.hoisted(() => vi.fn());
const mockEventsInsert = vi.hoisted(() => vi.fn());
const mockCalendar = vi.hoisted(() => vi.fn(() => ({ events: { insert: mockEventsInsert } })));

vi.mock("googleapis", () => ({
  google: {
    auth: { GoogleAuth: mockGoogleAuth },
    calendar: mockCalendar,
  },
}));

const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

import { createCalendarEvent } from "@/lib/google-calendar";

describe("createCalendarEvent", () => {
  it("returns null when GOOGLE_SERVICE_ACCOUNT_KEY is not set (and logs)", async () => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await createCalendarEvent({ summary: "Test", startDate: "2025-01-01" });
    expect(result).toBeNull();
    expect(consoleLogSpy).toHaveBeenCalledWith("[Google Calendar] No service account configured. Skipping event creation.");
    expect(consoleLogSpy).toHaveBeenCalledWith("[Google Calendar] Would create:", "Test", "2025-01-01", undefined);
    consoleLogSpy.mockRestore();
  });

  it("creates event with default start time (09:00) when startTime not provided", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01" });
    expect(mockEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          start: expect.objectContaining({ dateTime: "2025-01-01T09:00:00" }),
        }),
      })
    );
  });

  it("creates event with custom start time when provided", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01", startTime: "14:30" });
    expect(mockEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          start: expect.objectContaining({ dateTime: "2025-01-01T14:30:00" }),
        }),
      })
    );
  });

  it("creates event with default duration (60 min) when not provided", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01", startTime: "09:00" });
    const callArg = mockEventsInsert.mock.calls[0][0];
    expect(callArg.requestBody.end.dateTime).toBe("2025-01-01T10:00:00");
  });

  it("creates event with custom duration", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01", startTime: "09:00", duration: 90 });
    const callArg = mockEventsInsert.mock.calls[0][0];
    expect(callArg.requestBody.end.dateTime).toBe("2025-01-01T10:30:00");
  });

  it("uses default timezone when not provided", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01" });
    expect(mockEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          start: expect.objectContaining({ timeZone: "Africa/Monrovia" }),
          end: expect.objectContaining({ timeZone: "Africa/Monrovia" }),
        }),
      })
    );
  });

  it("uses custom timezone when provided", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01", timezone: "America/New_York" });
    expect(mockEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          start: expect.objectContaining({ timeZone: "America/New_York" }),
          end: expect.objectContaining({ timeZone: "America/New_York" }),
        }),
      })
    );
  });

  it("includes attendee when attendeeEmail is provided", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01", attendeeEmail: "test@example.com" });
    expect(mockEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({
          attendees: [{ email: "test@example.com" }],
        }),
      })
    );
  });

  it("does not include attendee when attendeeEmail is not provided", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01" });
    const callArg = mockEventsInsert.mock.calls[0][0];
    expect(callArg.requestBody.attendees).toBeUndefined();
  });

  it("returns event.data on success", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    const eventData = { id: "event123", htmlLink: "https://calendar.google.com/event" };
    mockEventsInsert.mockResolvedValue({ data: eventData });
    const result = await createCalendarEvent({ summary: "Test", startDate: "2025-01-01" });
    expect(result).toEqual(eventData);
  });

  it("returns null on error (catch block)", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockRejectedValue(new Error("API Error"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await createCalendarEvent({ summary: "Test", startDate: "2025-01-01" });
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[Google Calendar] Failed to create event:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it("passes correct credentials to GoogleAuth", async () => {
    const key = { client_email: "test@test.com", private_key: "abc123" };
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify(key);
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01" });
    expect(mockGoogleAuth).toHaveBeenCalledWith({
      credentials: key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
  });

  it("calculates end time correctly for 0 duration", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01", startTime: "10:00", duration: 0 });
    const callArg = mockEventsInsert.mock.calls[0][0];
    expect(callArg.requestBody.end.dateTime).toBe("2025-01-01T10:00:00");
  });

  it("passes description when provided", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "test@test.com" });
    mockEventsInsert.mockResolvedValue({ data: { id: "event123" } });
    await createCalendarEvent({ summary: "Test", startDate: "2025-01-01", description: "A description" });
    expect(mockEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestBody: expect.objectContaining({ description: "A description" }),
      })
    );
  });

  it("handles error when GOOGLE_SERVICE_ACCOUNT_KEY has invalid JSON", async () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = "{invalid json}";
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await createCalendarEvent({ summary: "Test", startDate: "2025-01-01" });
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
