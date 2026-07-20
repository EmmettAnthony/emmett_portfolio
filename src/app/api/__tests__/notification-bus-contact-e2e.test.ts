// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Contact End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from POST /api/contact → notifyNewContactSubmission
// → sendNotification → notification-bus emit → listener. Does NOT mock the
// event handlers or the bus — only mocks external dependencies.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockVerifyTurnstile = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const mockContactNotification = vi.hoisted(() => vi.fn((params: { name: string; email: string; subject: string }) =>
  `<h1>Contact Form Submission</h1><p>From: ${params.name}</p><p>Email: ${params.email}</p><p>Subject: ${params.subject}</p>`
));

// Prisma mocks — contact route + submitContact action + sendNotification
const mockContactCreate = vi.hoisted(() => vi.fn());
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

vi.mock("@/lib/email-templates", () => ({
  contactNotification: mockContactNotification,
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
    contact: {
      create: (...args: unknown[]) => mockContactCreate(...args),
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
    id: "e2e-notif-" + String(Math.random()).slice(2),
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
    source: (data.source as string) ?? "contact",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: (data.sentAt as Date | null) ?? null,
    expiresAt: null,
  };
}

// ─── Bus cleanup tracking ─────────────────────────────────────────────────

const busCleanups: (() => void)[] = [];

// ─── Fixtures ───────────────────────────────────────────────────────────────

const CONTACT_BODY = {
  name: "Alice Smith",
  email: "alice@example.com",
  phone: "+1-555-0123",
  company: "Acme Corp",
  projectType: "web_development",
  budget: "$1,000 - $5,000",
  timeline: "Within 1 Month",
  subject: "Project Inquiry",
  message: "I'd like to discuss a new project for my company website.",
};

const CREATED_CONTACT = {
  id: "contact-1",
  fullName: "Alice Smith",
  email: "alice@example.com",
  phone: "+1-555-0123",
  company: "Acme Corp",
  projectType: "web-development",
  projectDetails: "I'd like to discuss a new project.",
  status: "NEW",
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  // Rate limit: allow by default
  mockCheckRateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 60000 });

  // Turnstile: pass by default
  mockVerifyTurnstile.mockResolvedValue(true);

  // Contact created
  mockContactCreate.mockResolvedValue(CREATED_CONTACT);

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

describe("Notification Bus E2E: POST /api/contact → notifyNewContactSubmission → bus", () => {
  it("direct emitNotification reaches the listener synchronously", async () => {
    const { onNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    emitNotification({
      notification: {
        id: "sanity-1", userId: null, category: "CONTACT", priority: "MEDIUM",
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

  it("delivers a bus event when contact submission is created successfully", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // Enable email sending for the full pipeline test
    process.env.RESEND_API_KEY = "test-key";

    const { POST } = await import("@/app/api/contact/route");

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(CONTACT_BODY),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(201);

    // Wait for the fire-and-forget notifyNewContactSubmission to settle
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
    expect(busEvent.eventKey).toBe("contact.submission.new");
    // EVENT_PRIORITY_MAP: "contact.submission.new" → "MEDIUM" → not urgent
    expect(busEvent.isUrgent).toBe(false);
    expect(busEvent.notification.source).toBe("contact");
    expect(busEvent.notification.category).toBe("CONTACT");
    expect(busEvent.notification.title).toBe("New Contact Form: Alice Smith");
    expect(busEvent.notification.message).toContain("alice@example.com");
    expect(busEvent.notification.message).toContain("web_development");
    expect(busEvent.notification.link).toBe("/dashboard/contact/submissions");

    // Verify notification was persisted
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalled();

    // Verify emails were sent: 2 route emails + notification bus dispatch
    expect(mockEmailSend.mock.calls.length).toBeGreaterThanOrEqual(2);

    // Owner notification: to site owner, replyTo set back to submitter, subject with [Contact] prefix
    expect(mockEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      replyTo: "alice@example.com",
      subject: "[Contact] Project Inquiry",
    }));
    // Verify owner notification body content
    const ownerCall = mockEmailSend.mock.calls.find(
      (c: { subject?: string }[]) => c[0]?.subject === "[Contact] Project Inquiry"
    )?.[0];
    expect(ownerCall).toBeDefined();
    expect(ownerCall.html).toContain("Contact Form Submission");
    expect(ownerCall.html).toContain("Alice Smith");

    // Client auto-reply: to the submitter, subject "Thanks for reaching out!"
    expect(mockEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      to: ["alice@example.com"],
      subject: "Thanks for reaching out!",
    }));
    const clientCall = mockEmailSend.mock.calls.find(
      (c: { subject?: string }[]) => c[0]?.subject === "Thanks for reaching out!"
    )?.[0];
    expect(clientCall).toBeDefined();
    expect(clientCall.html).toContain("Message Received!");
    expect(clientCall.html).toContain("Hi Alice Smith,");

    // The third call is the notification bus dispatching the email channel
    // (notifyNewContactSubmission → sendNotification → dispatchEmail)
  });

  it("does NOT deliver a bus event when rate limited", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockCheckRateLimit.mockReturnValue({ allowed: false, resetAt: Date.now() + 60000 });

    const { POST } = await import("@/app/api/contact/route");

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(CONTACT_BODY),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(429);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver a bus event when validation fails", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { POST } = await import("@/app/api/contact/route");

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "bad" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(400);
    expect(busEvents).toHaveLength(0);
  });

  it("returns 400 when email is empty string", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...CONTACT_BODY, email: "" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(mockContactCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when email is null", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...CONTACT_BODY, email: null }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(400);
    expect(mockContactCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when email is whitespace-only", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...CONTACT_BODY, email: "   " }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    expect(response.status).toBe(400);
    expect(mockContactCreate).not.toHaveBeenCalled();
  });

  it("sets notification source to 'contact' in the bus event", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    process.env.RESEND_API_KEY = "test-key";

    const { POST } = await import("@/app/api/contact/route");

    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(CONTACT_BODY),
    });

    await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any);

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as {
      notification: Record<string, unknown>;
    };

    expect(busEvent.notification.source).toBe("contact");
    expect(busEvent.notification.id).toEqual(expect.stringContaining("e2e-notif-"));
    expect(busEvent.notification.category).toBe("CONTACT");
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();

    // Contact was created via submitContact action
    expect(mockContactCreate).toHaveBeenCalled();
  });
});
