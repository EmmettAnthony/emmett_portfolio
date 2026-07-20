// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Booking End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from POST /api/booking → notifyAppointmentBooked
// → sendNotification → notification-bus emit → listener. Does NOT mock the
// event handlers or the bus — only mocks external dependencies.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockVerifyTurnstile = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const mockCreateCalendarEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

const mockOwnerBookingNotif = vi.hoisted(() => vi.fn((params: { name: string; email: string; preferredDate: string }) =>
  `<h1>Owner Notification</h1><p>New booking from ${params.name}</p><p>Email: ${params.email}</p><p>Date: ${params.preferredDate}</p>`
));
const mockClientConfirmation = vi.hoisted(() => vi.fn((params: { name: string; preferredDate: string }) =>
  `<h1>Booking Confirmed</h1><p>Hi ${params.name},</p><p>Your consultation on ${params.preferredDate} has been booked.</p>`
));

// Prisma mocks
const mockAppointmentCreate = vi.hoisted(() => vi.fn());
const mockAppointmentFindFirst = vi.hoisted(() => vi.fn());
const mockMeetingTypeFindUnique = vi.hoisted(() => vi.fn());
const mockContactEmailLogCreate = vi.hoisted(() => vi.fn());
const mockNotifCreate = vi.hoisted(() => vi.fn());
const mockNotifPrefFindUnique = vi.hoisted(() => vi.fn());
const mockNotifLogCreate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn());

// ─── Module-level mocks ─────────────────────────────────────────────────────

vi.mock("@/lib/security", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: mockVerifyTurnstile,
}));

vi.mock("@/lib/google-calendar", () => ({
  createCalendarEvent: mockCreateCalendarEvent,
}));

vi.mock("@/lib/email-templates", () => ({
  ownerBookingNotification: mockOwnerBookingNotif,
  clientConfirmation: mockClientConfirmation,
}));

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({
    emails: { send: mockEmailSend },
  })),
}));

vi.mock("@/lib/sentry", () => ({ captureError: vi.fn() }));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

vi.mock("@/lib/db", () => {
  const prismaObj = {
    appointment: {
      create: (...args: unknown[]) => mockAppointmentCreate(...args),
      findFirst: (...args: unknown[]) => mockAppointmentFindFirst(...args),
    },
    meetingType: {
      findUnique: (...args: unknown[]) => mockMeetingTypeFindUnique(...args),
    },
    contactEmailLog: {
      create: (...args: unknown[]) => mockContactEmailLogCreate(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotifCreate(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => mockNotifPrefFindUnique(...args),
    },
    notificationLog: {
      create: (...args: unknown[]) => mockNotifLogCreate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  };
  return {
    getPrisma: vi.fn(() => prismaObj),
    prisma: prismaObj,
  };
});

// ─── Dynamic mock for notification.create ──────────────────────────────────

function mockNotifCreateImpl(args: { data?: Record<string, unknown> }) {
  const data = args.data ?? {};
  return {
    id: "e2e-notif-" + Date.now(),
    userId: null,
    category: (data.category as string) ?? "SYSTEM",
    priority: (data.priority as string) ?? "MEDIUM",
    notifType: (data.notifType as string) ?? "INFO",
    title: (data.title as string) ?? "",
    message: (data.message as string | null) ?? null,
    link: (data.link as string | null) ?? null,
    image: null,
    key: (data.key as string | null) ?? null,
    read: false,
    archived: false,
    pinned: false,
    snoozedUntil: null,
    acknowledged: false,
    actionLabel: null,
    actionUrl: null,
    metadata: null,
    source: (data.source as string) ?? "calendar",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: (data.sentAt as Date | null) ?? null,
    expiresAt: null,
  };
}

// ─── Bus cleanup tracking ─────────────────────────────────────────────────

const busCleanups: (() => void)[] = [];

// ─── Fixtures ───────────────────────────────────────────────────────────────

const BOOKING_BODY = {
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  phone: "+1-555-0123",
  company: "Acme Corp",
  projectType: "Web Application",
  budget: "$1,000 - $5,000",
  timeline: "Within 1 Month",
  projectDescription: "Building a new company website",
  preferredDate: "2026-08-15",
  preferredTime: "10:00",
  duration: 30,
  terms: true,
  meetingTypeId: "mt-1",
};

const CREATED_APPOINTMENT = {
  id: "apt-booked-1",
  name: "Alice Smith",
  email: "alice@example.com",
  phone: "+1-555-0123",
  company: "Acme Corp",
  projectType: "web-development",
  preferredDate: new Date("2026-08-15T00:00:00Z"),
  preferredTime: "10:00",
  duration: 30,
  message: "Building a new company website",
  status: "PENDING",
  source: "WEBSITE",
  timezone: null,
  meetingTypeId: "mt-1",
  contactId: null,
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
};

const MEETING_TYPE = { id: "mt-1", name: "Consultation" };

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  // Rate limit: allow by default
  mockCheckRateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60000 });

  // Turnstile: pass by default
  mockVerifyTurnstile.mockResolvedValue(true);

  // Clear turnstile env var so the route doesn't require a token
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // No conflicting slot
  mockAppointmentFindFirst.mockResolvedValue(null);

  // Meeting type exists
  mockMeetingTypeFindUnique.mockResolvedValue(MEETING_TYPE);

  // Appointment created
  mockAppointmentCreate.mockResolvedValue(CREATED_APPOINTMENT);

  // sendNotification mocks
  mockNotifCreate.mockImplementation(mockNotifCreateImpl);
  mockNotifPrefFindUnique.mockResolvedValue(null);
  mockNotifLogCreate.mockResolvedValue({});
});

afterEach(() => {
  for (const cleanup of busCleanups) {
    cleanup();
  }
  busCleanups.length = 0;
});

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("Notification Bus E2E: POST /api/booking → notifyAppointmentBooked → bus", () => {
  it("direct emitNotification reaches the listener synchronously", async () => {
    const { onNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    emitNotification({
      notification: {
        id: "sanity-1", userId: null, category: "CALENDAR", priority: "MEDIUM",
        notifType: "INFO", key: null, title: "Sanity", message: null, link: null,
        image: null, read: false, archived: false, pinned: false,
        snoozedUntil: null, acknowledged: false, actionLabel: null, actionUrl: null,
        metadata: null, source: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        sentAt: null, expiresAt: null,
      },
      eventKey: "test.sanity",
      isUrgent: false,
    });

    expect(busEvents).toHaveLength(1);
  });

  it("delivers a bus event when booking is created successfully", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // Enable email sending for the full pipeline test
    process.env.RESEND_API_KEY = "test-key";

    const { POST } = await import("@/app/api/booking/route");

const request = new Request("http://localhost:3000/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(BOOKING_BODY),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(201);

    // Wait for the fire-and-forget notifyAppointmentBooked to settle
    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as {
      notification: Record<string, unknown>;
      eventKey: string;
      isUrgent: boolean;
    };
    expect(busEvent.eventKey).toBe("calendar.appointment.booked");
    // EVENT_PRIORITY_MAP: "calendar.appointment.booked" → "MEDIUM" → not urgent
    expect(busEvent.isUrgent).toBe(false);
    expect(busEvent.notification.source).toBe("calendar");
    expect(busEvent.notification.category).toBe("CALENDAR");
    expect(busEvent.notification.title).toBe("New Booking: Alice Smith");
    expect(busEvent.notification.message).toContain("Consultation");
    expect(busEvent.notification.message).toContain("alice@example.com");
    expect(busEvent.notification.link).toBe("/dashboard/calendar/appointments/apt-booked-1");

    // Verify notification was persisted
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalled();

    // Verify emails were sent (owner notification + client confirmation)
    expect(mockEmailSend).toHaveBeenCalledTimes(2);

    // Owner notification email
    expect(mockEmailSend).toHaveBeenCalledWith({
      from: expect.stringContaining("Emmett Anthony"),
      to: ["emmettanthony998@gmail.com"],
      replyTo: "alice@example.com",
      subject: expect.stringContaining("Consultation request from Alice Smith"),
      html: expect.stringContaining("Owner Notification"),
    });
    // Verify owner notification body content
    const ownerCall = mockEmailSend.mock.calls[0][0];
    expect(ownerCall.html).toContain("New booking from Alice Smith");
    expect(ownerCall.html).toContain("Email: alice@example.com");
    expect(ownerCall.html).toContain("Date: 2026-08-15");

    // Client confirmation email
    expect(mockEmailSend).toHaveBeenCalledWith({
      from: expect.stringContaining("Emmett Anthony"),
      to: ["alice@example.com"],
      subject: expect.stringContaining("Booking confirmed — Alice Smith"),
      html: expect.stringContaining("Booking Confirmed"),
    });
    // Verify client confirmation body content
    const clientCall = mockEmailSend.mock.calls[1][0];
    expect(clientCall.html).toContain("Hi Alice Smith,");
    expect(clientCall.html).toContain("Your consultation on 2026-08-15 has been booked.");
  });

  it("does NOT deliver a bus event when rate limited", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockCheckRateLimit.mockReturnValue({ allowed: false, resetAt: Date.now() + 60000 });

    const { POST } = await import("@/app/api/booking/route");

const request = new Request("http://localhost:3000/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(BOOKING_BODY),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(429);
    // No appointment should be created
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver a bus event when validation fails", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { POST } = await import("@/app/api/booking/route");

const request = new Request("http://localhost:3000/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "", email: "not-an-email" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(400);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver a bus event when time slot is taken", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // Conflict: slot already taken
    mockAppointmentFindFirst.mockResolvedValue({ id: "existing-apt" });

    const { POST } = await import("@/app/api/booking/route");

const request = new Request("http://localhost:3000/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(BOOKING_BODY),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(409);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver a bus event when meeting type is invalid", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // Meeting type not found
    mockMeetingTypeFindUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/booking/route");

const request = new Request("http://localhost:3000/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(BOOKING_BODY),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(400);
    expect(busEvents).toHaveLength(0);
  });
});
