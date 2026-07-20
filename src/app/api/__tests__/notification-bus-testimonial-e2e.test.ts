// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Testimonial End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from PUT /api/admin/testimonials/[id] →
// notifyTestimonialApproved → sendNotification → notification-bus emit.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

const mockTestimonialFindUnique = vi.hoisted(() => vi.fn());
const mockTestimonialUpdate = vi.hoisted(() => vi.fn());
const mockNotifCreate = vi.hoisted(() => vi.fn());
const mockNotifPrefFindUnique = vi.hoisted(() => vi.fn());
const mockNotifLogCreate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn());

// ─── Module-level mocks ─────────────────────────────────────────────────────

vi.mock("@/../auth", () => ({ auth: mockAuth }));

vi.mock("@/lib/sentry", () => ({ captureError: vi.fn() }));

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({
    emails: { send: mockEmailSend },
  })),
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

vi.mock("@/lib/db", () => {
  const prismaObj = {
    testimonial: {
      findUnique: (...args: unknown[]) => mockTestimonialFindUnique(...args),
      update: (...args: unknown[]) => mockTestimonialUpdate(...args),
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

// ─── Dynamic notification.create mock ──────────────────────────────────────

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
    source: (data.source as string) ?? "testimonial",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: (data.sentAt as Date | null) ?? null,
    expiresAt: null,
  };
}

// ─── Bus cleanup tracking ─────────────────────────────────────────────────

const busCleanups: (() => void)[] = [];

// ─── Fixtures ───────────────────────────────────────────────────────────────

const BASE_TESTIMONIAL = {
  id: "test-e2e-1",
  name: "Alice Smith",
  clientName: null,
  email: "alice@example.com",
  rating: 5,
  content: "Amazing work! Highly recommend.",
  approved: false,
  status: "PENDING_REVIEW",
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });

  mockTestimonialUpdate.mockResolvedValue({ ...BASE_TESTIMONIAL });

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

describe("Notification Bus E2E: PUT admin testimonial APPROVED → bus", () => {
  it("direct emitNotification reaches the listener synchronously", async () => {
    const { onNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    emitNotification({
      notification: {
        id: "sanity-1", userId: null, category: "TESTIMONIAL", priority: "MEDIUM",
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

  it("delivers a bus event when testimonial is approved via PUT handler", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const APPROVED_TESTIMONIAL = {
      ...BASE_TESTIMONIAL,
      approved: true,
      status: "APPROVED",
    };
    mockTestimonialUpdate.mockResolvedValue(APPROVED_TESTIMONIAL);

    const { PUT } = await import("@/app/api/admin/testimonials/[id]/route");

    const request = new Request("http://localhost:3000/api/admin/testimonials/test-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "test-e2e-1" }),
    });

    expect(response.status).toBe(200);

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
    expect(busEvent.eventKey).toBe("testimonial.approved");
    expect(busEvent.notification.source).toBe("testimonial");
    expect(busEvent.notification.title).toBe("Testimonial Approved: Alice Smith");
    expect(busEvent.notification.message).toContain("now live");
    expect(busEvent.notification.link).toBe("/dashboard/testimonials");
    expect(busEvent.notification.category).toBe("TESTIMONIAL");

    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
  });

  it("does NOT deliver a bus event when status is not APPROVED", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockTestimonialUpdate.mockResolvedValue({
      ...BASE_TESTIMONIAL,
      rating: 4,
    });

    const { PUT } = await import("@/app/api/admin/testimonials/[id]/route");

    const request = new Request("http://localhost:3000/api/admin/testimonials/test-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4 }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "test-e2e-1" }),
    });

    expect(response.status).toBe(200);
    expect(busEvents).toHaveLength(0);
  });

  it("returns 401 and does NOT deliver bus event when unauthenticated", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockAuth.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/admin/testimonials/[id]/route");

    const request = new Request("http://localhost:3000/api/admin/testimonials/test-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "test-e2e-1" }),
    });

    expect(response.status).toBe(401);
    expect(busEvents).toHaveLength(0);
  });

  it("sets notification source to 'testimonial' in the bus event", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockTestimonialUpdate.mockResolvedValue({
      ...BASE_TESTIMONIAL,
      approved: true,
      status: "APPROVED",
    });

    const { PUT } = await import("@/app/api/admin/testimonials/[id]/route");

    const request = new Request("http://localhost:3000/api/admin/testimonials/test-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "test-e2e-1" }) });

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as { notification: Record<string, unknown> };
    expect(busEvent.notification.source).toBe("testimonial");
    expect(busEvent.notification.id).toEqual(expect.stringContaining("e2e-notif-"));
    expect(busEvent.notification.category).toBe("TESTIMONIAL");
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
  });
});
