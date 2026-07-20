// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from HTTP route → event handler → sendNotification
// → notification-bus emit → listener. Does NOT mock the event handlers or the
// bus — only mocks external dependencies (auth, prisma, resend, sentry).
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

// Prisma mocks — we need to cover both the appointment route AND sendNotification
const mockAppointmentFindUnique = vi.hoisted(() => vi.fn());
const mockAppointmentUpdate = vi.hoisted(() => vi.fn());
const mockAppointmentLogCreate = vi.hoisted(() => vi.fn());
const mockNotifCreate = vi.hoisted(() => vi.fn());
const mockNotifPrefFindUnique = vi.hoisted(() => vi.fn());
const mockNotifLogCreate = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn());

// ─── Module-level mocks (hoisted) ───────────────────────────────────────────

vi.mock("@/../auth", () => ({ auth: mockAuth }));

vi.mock("@/lib/sentry", () => ({ captureError: vi.fn() }));

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({
    emails: { send: mockEmailSend },
  })),
}));

vi.mock("@/lib/email/templates", () => ({
  appointmentConfirmationTemplate: vi.fn((params: { name: string }) => ({
    subject: "Confirmed",
    html: `<h1>Appointment Confirmed</h1><p>Hi ${params.name},</p><p>Your appointment has been confirmed.</p>`,
  })),
  appointmentCancelledTemplate: vi.fn((params: { name: string; reason?: string }) => ({
    subject: "Cancelled",
    html: `<h1>Appointment Cancelled</h1><p>Hi ${params.name},</p><p>Reason: ${params.reason || "Not provided"}</p>`,
  })),
  appointmentRescheduledTemplate: vi.fn((params: { name: string }) => ({
    subject: "Rescheduled",
    html: `<h1>Appointment Rescheduled</h1><p>Hi ${params.name},</p><p>Your appointment has been moved.</p>`,
  })),
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

// Prisma mock — covers both appointment route + sendNotification + logNotificationDelivery
vi.mock("@/lib/db", () => {
  const prismaObj = {
    appointment: {
      findUnique: (...args: unknown[]) => mockAppointmentFindUnique(...args),
      update: (...args: unknown[]) => mockAppointmentUpdate(...args),
    },
    appointmentLog: {
      create: (...args: unknown[]) => mockAppointmentLogCreate(...args),
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
      findUnique: vi.fn(),
    },
  };
  return {
    getPrisma: vi.fn(() => prismaObj),
    prisma: prismaObj,
  };
});

// ─── Dynamic Prisma mock for notification.create ──────────────────────────
// Extracts the actual title/message from the data argument so we can verify
// the notification payload that flows through to the bus.

function mockNotifCreateImpl(args: { data?: Record<string, unknown> }) {
  const data = args.data ?? {};
  return {
    id: "e2e-notif-" + Date.now(),
    userId: data.userId !== undefined && data.userId !== null ? String(data.userId) : null,
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
// Since the notification-bus is a singleton EventEmitter, we MUST clean up
// listeners in afterEach to avoid leaking between tests (especially on failure).

const busCleanups: (() => void)[] = [];

// ─── Fixtures ───────────────────────────────────────────────────────────────

const BASE_APPOINTMENT = {
  id: "apt-e2e-1",
  name: "Alice Smith",
  email: "alice@example.com",
  phone: null,
  company: null,
  projectType: null,
  preferredDate: new Date("2026-07-22T10:00:00Z"),
  preferredTime: "10:00",
  duration: 30,
  message: "Project discussion",
  notes: null,
  status: "PENDING",
  source: "WEBSITE",
  timezone: "America/New_York",
  meetingTypeId: null,
  contactId: null,
  projectId: null,
  clientId: null,
  cancellationReason: null,
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
  meetingType: null,
};

const UPDATED_APPOINTMENT = {
  ...BASE_APPOINTMENT,
  status: "COMPLETED",
  completedAt: new Date(),
  meetingType: { name: "Strategy Session" },
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  // Auth: authenticated as admin
  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });

  // Appointment route mock: existing + updated appointment
  mockAppointmentFindUnique.mockResolvedValue(BASE_APPOINTMENT);
  mockAppointmentUpdate.mockResolvedValue(UPDATED_APPOINTMENT);
  mockAppointmentLogCreate.mockResolvedValue({ id: "log-1" });

  // sendNotification mock: dynamic notification.create
  mockNotifCreate.mockImplementation(mockNotifCreateImpl);
  // No notification preferences = use default channels
  mockNotifPrefFindUnique.mockResolvedValue(null);
  // Delivery log
  mockNotifLogCreate.mockResolvedValue({});
});

afterEach(() => {
  // Clean up ALL bus listeners registered during this test
  for (const cleanup of busCleanups) {
    cleanup();
  }
  busCleanups.length = 0;
});

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("Notification Bus E2E: PUT appointment COMPLETED → bus", () => {
  it("direct emitNotification reaches the listener synchronously", async () => {
    // Sanity check: verify the bus itself works before testing the pipeline
    const { onNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    emitNotification({
      notification: {
        id: "sanity-1",
        userId: null,
        category: "SYSTEM",
        priority: "MEDIUM",
        notifType: "INFO",
        key: null,
        title: "Sanity Check",
        message: null,
        link: null,
        image: null,
        read: false,
        archived: false,
        pinned: false,
        snoozedUntil: null,
        acknowledged: false,
        actionLabel: null,
        actionUrl: null,
        metadata: null,
        source: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sentAt: null,
        expiresAt: null,
      },
      eventKey: "test.sanity",
      isUrgent: false,
    });

    expect(busEvents).toHaveLength(1);
  });

  it("delivers a bus event when appointment is completed via PUT handler", async () => {
    // ── 1. Subscribe to the real notification-bus ────────────────────────
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // ── 2. Import the real PUT handler (event handlers NOT mocked) ───────
    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "apt-e2e-1" }),
    });

    // ── 3. Assert HTTP response ─────────────────────────────────────────
    expect(response.status).toBe(200);

    // ── 4. Bus events are delivered asynchronously (fire-and-forget) ────
    // The route calls notifyMeetingCompleted(...).catch(() => {}) — not awaited.
    // Use vi.waitFor to handle the async microtask chain.
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
    expect(busEvent.eventKey).toBe("calendar.meeting.completed");
    expect(busEvent.isUrgent).toBe(false); // priorityOverride: "LOW"

    // Verify the notification payload that flowed through sendNotification
    expect(busEvent.notification.title).toBe("Meeting Completed: Alice Smith");
    expect(busEvent.notification.message).toBe("Strategy Session has ended");
    expect(busEvent.notification.source).toBe("calendar");
    expect(busEvent.notification.priority).toBe("LOW");
    expect(busEvent.notification.link).toBe("/dashboard/calendar/appointments/apt-e2e-1");
    expect(busEvent.notification.category).toBe("CALENDAR");
    expect(busEvent.notification.notifType).toBe("INFO");

    // Confirm sendNotification ran to completion
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it("does NOT deliver bus event when status is not COMPLETED or RESCHEDULED", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // Update appointment to CONFIRMED (no notification should fire)
    mockAppointmentUpdate.mockResolvedValue({
      ...BASE_APPOINTMENT,
      status: "CONFIRMED",
      confirmedAt: new Date(),
      meetingType: { name: "Consultation" },
    });

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    // No sendNotification should have been called for CONFIRMED
    expect(busEvents).toHaveLength(0);
  });

  it("delivers a bus event for RESCHEDULED status changes", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const newDate = new Date("2026-08-01T14:00:00Z");
    mockAppointmentUpdate.mockResolvedValue({
      ...BASE_APPOINTMENT,
      status: "RESCHEDULED",
      preferredDate: newDate,
      meetingType: { name: "Consultation" },
    });

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESCHEDULED", preferredDate: "2026-08-01T14:00:00Z" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as { eventKey: string };
    expect(busEvent.eventKey).toBe("calendar.appointment.rescheduled");
  });

  it("delivers a bus event for CANCELLED status changes via notifyAppointmentCancelled", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockAppointmentUpdate.mockResolvedValue({
      ...BASE_APPOINTMENT,
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: "Schedule conflict",
      meetingType: { name: "Consultation" },
    });

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", cancellationReason: "Schedule conflict" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as {
      notification: Record<string, unknown>;
      eventKey: string;
    };
    expect(busEvent.eventKey).toBe("calendar.appointment.cancelled");
    expect(busEvent.notification.title).toBe("Booking Cancelled: Alice Smith");
    expect(busEvent.notification.message).toContain("Schedule conflict");
    expect(busEvent.notification.message).toContain("7/22/2026");
    expect(busEvent.notification.source).toBe("calendar");
    expect(busEvent.notification.link).toBe("/dashboard/calendar/appointments/apt-e2e-1");
    expect(busEvent.notification.category).toBe("CALENDAR");
  });

  it("does NOT deliver bus event when appointment is not found", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockAppointmentFindUnique.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    expect(response.status).toBe(404);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT send email when status is COMPLETED", async () => {
    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    // Email should NOT be sent for COMPLETED status
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("sends email when status is CONFIRMED", async () => {
    mockAppointmentUpdate.mockResolvedValue({
      ...BASE_APPOINTMENT,
      status: "CONFIRMED",
      confirmedAt: new Date(),
      meetingType: { name: "Consultation" },
    });

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    // Email SHOULD be sent for CONFIRMED status
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith({
      from: expect.stringContaining("Emmett Anthony"),
      to: "alice@example.com",
      subject: "Confirmed",
      html: expect.stringContaining("Alice Smith"),
    });
    // Verify the html body content
    const call = mockEmailSend.mock.calls[0][0];
    expect(call.html).toContain("Appointment Confirmed");
    expect(call.html).toContain("Hi Alice Smith,");
    expect(call.html).toContain("confirmed");
  });

  it("sends email when status is CANCELLED", async () => {
    mockAppointmentUpdate.mockResolvedValue({
      ...BASE_APPOINTMENT,
      status: "CANCELLED",
      cancelledAt: new Date(),
      meetingType: { name: "Consultation" },
    });

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", cancellationReason: "Schedule conflict" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith({
      from: expect.stringContaining("Emmett Anthony"),
      to: "alice@example.com",
      subject: "Cancelled",
      html: expect.stringContaining("Alice Smith"),
    });
    // Verify the html body content includes cancellation details and reason
    const cancelCall = mockEmailSend.mock.calls[0][0];
    expect(cancelCall.html).toContain("Appointment Cancelled");
    expect(cancelCall.html).toContain("Hi Alice Smith,");
    expect(cancelCall.html).toContain("Reason: Schedule conflict");
  });

  it("sends email when status is RESCHEDULED", async () => {
    const newDate = new Date("2026-08-01T14:00:00Z");
    mockAppointmentUpdate.mockResolvedValue({
      ...BASE_APPOINTMENT,
      status: "RESCHEDULED",
      preferredDate: newDate,
      meetingType: { name: "Consultation" },
    });

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESCHEDULED", preferredDate: "2026-08-01T14:00:00Z" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith({
      from: expect.stringContaining("Emmett Anthony"),
      to: "alice@example.com",
      subject: "Rescheduled",
      html: expect.stringContaining("Alice Smith"),
    });
    // Verify the html body content includes rescheduling details
    const rescheduleCall = mockEmailSend.mock.calls[0][0];
    expect(rescheduleCall.html).toContain("Appointment Rescheduled");
    expect(rescheduleCall.html).toContain("Hi Alice Smith,");
    expect(rescheduleCall.html).toContain("moved");
  });

  it("does NOT send email when appointment.email is null", async () => {
    // Appointment with null email
    const nullEmailAppointment = {
      ...BASE_APPOINTMENT,
      email: null as string | null,
    };
    mockAppointmentFindUnique.mockResolvedValue(nullEmailAppointment);
    mockAppointmentUpdate.mockResolvedValue({
      ...nullEmailAppointment,
      status: "CONFIRMED",
      confirmedAt: new Date(),
      meetingType: { name: "Consultation" },
    });

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    // Email should NOT be sent when the appointment has no email address
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("does NOT send email when appointment.email is empty string", async () => {
    // Appointment with empty string email (also falsy like null)
    const emptyEmailAppointment = {
      ...BASE_APPOINTMENT,
      email: "" as string,
    };
    mockAppointmentFindUnique.mockResolvedValue(emptyEmailAppointment);
    mockAppointmentUpdate.mockResolvedValue({
      ...emptyEmailAppointment,
      status: "CONFIRMED",
      confirmedAt: new Date(),
      meetingType: { name: "Consultation" },
    });

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    // Email should NOT be sent when the appointment email is an empty string
    // The guard `if (template && appointment.email)` catches both null and ""
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("sets notification source to 'calendar' in the bus event", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { PUT } = await import("@/app/api/calendar/appointments/[id]/route");

    const request = new Request("http://localhost:3000/api/calendar/appointments/apt-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-e2e-1" }) });

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as {
      notification: Record<string, unknown>;
    };

    // The notification in the bus should have source: "calendar"
    expect(busEvent.notification.source).toBe("calendar");
    // The bus event should have a notificationId on the notification object
    expect(busEvent.notification.id).toEqual(expect.stringContaining("e2e-notif-"));
    // Route handler called appointmentLog.create
    expect(mockAppointmentLogCreate).toHaveBeenCalled();
    // sendNotification created a notification in the DB
    expect(mockNotifCreate).toHaveBeenCalled();
  });

});
