// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Newsletter Verify End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from GET /api/newsletter/verify → notifyNewSubscriber
// → sendNotification → notification-bus emit → listener. Does NOT mock the
// event handlers or the bus — only mocks external dependencies.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

// Prisma mocks — verify route + sendNotification
const mockSubscriberFindFirst = vi.hoisted(() => vi.fn());
const mockSubscriberUpdate = vi.hoisted(() => vi.fn());
const mockAnalyticsEventCreate = vi.hoisted(() => vi.fn());
const mockNotifCreate = vi.hoisted(() => vi.fn());
const mockNotifPrefFindUnique = vi.hoisted(() => vi.fn());
const mockNotifLogCreate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn());

// ─── Module-level mocks ─────────────────────────────────────────────────────

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
    subscriber: {
      findFirst: (...args: unknown[]) => mockSubscriberFindFirst(...args),
      update: (...args: unknown[]) => mockSubscriberUpdate(...args),
    },
    analyticsEvent: {
      create: (...args: unknown[]) => mockAnalyticsEventCreate(...args),
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
    source: (data.source as string) ?? "newsletter",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: (data.sentAt as Date | null) ?? null,
    expiresAt: null,
  };
}

// ─── Bus cleanup tracking ─────────────────────────────────────────────────

const busCleanups: (() => void)[] = [];

// ─── Fixtures ───────────────────────────────────────────────────────────────

const PENDING_SUBSCRIBER = {
  id: "sub-verify-1",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  source: "footer",
  status: "PENDING_VERIFICATION",
  verificationToken: "valid-token-123",
  verifiedAt: null,
  subscribedAt: null,
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
};

const UPDATED_SUBSCRIBER = {
  ...PENDING_SUBSCRIBER,
  status: "ACTIVE",
  verifiedAt: new Date(),
  verificationToken: null,
  subscribedAt: new Date(),
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  // Subscriber found with valid token
  mockSubscriberFindFirst.mockResolvedValue(PENDING_SUBSCRIBER);
  mockSubscriberUpdate.mockResolvedValue(UPDATED_SUBSCRIBER);
  mockAnalyticsEventCreate.mockResolvedValue({});

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

describe("Notification Bus E2E: GET /api/newsletter/verify → notifyNewSubscriber → bus", () => {
  it("direct emitNotification reaches the listener synchronously", async () => {
    const { onNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    emitNotification({
      notification: {
        id: "sanity-1", userId: null, category: "NEWSLETTER", priority: "LOW",
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

  it("delivers a bus event when email is verified successfully", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { GET } = await import("@/app/api/newsletter/verify/route");

    const request = new Request("http://localhost:3000/api/newsletter/verify?token=valid-token-123");

    const response = await GET(request);

    expect(response.status).toBe(200);

    // Wait for the fire-and-forget notifyNewSubscriber to settle
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
    expect(busEvent.eventKey).toBe("newsletter.subscriber.new");
    // EVENT_PRIORITY_MAP: "newsletter.subscriber.new" → "LOW" → not urgent
    expect(busEvent.isUrgent).toBe(false);
    expect(busEvent.notification.source).toBe("newsletter");
    expect(busEvent.notification.category).toBe("NEWSLETTER");
    expect(busEvent.notification.title).toBe("New Subscriber: Alice Smith");
    expect(busEvent.notification.message).toContain("alice@example.com");
    expect(busEvent.notification.message).toContain("footer");
    expect(busEvent.notification.link).toBe("/dashboard/newsletter/subscribers");

    // Verify notification was persisted
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalled();

    // Subscriber was updated to ACTIVE
    expect(mockSubscriberUpdate).toHaveBeenCalled();

    // No direct emails sent (verify route only fires a bus notification, no email)
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("does NOT deliver a bus event when token is missing", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { GET } = await import("@/app/api/newsletter/verify/route");

    const request = new Request("http://localhost:3000/api/newsletter/verify");

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver a bus event when token is invalid", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockSubscriberFindFirst.mockResolvedValue(null);

    const { GET } = await import("@/app/api/newsletter/verify/route");

    const request = new Request("http://localhost:3000/api/newsletter/verify?token=bad-token");

    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver a bus event when email is already verified", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // Subscriber already verified
    mockSubscriberFindFirst.mockResolvedValue({
      ...PENDING_SUBSCRIBER,
      verifiedAt: new Date(),
    });

    const { GET } = await import("@/app/api/newsletter/verify/route");

    const request = new Request("http://localhost:3000/api/newsletter/verify?token=valid-token-123");

    await GET(request);

    // No notification should fire — subscriber was already verified, no update
    expect(busEvents).toHaveLength(0);
  });

  it("sets notification source to 'newsletter' in the bus event", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { GET } = await import("@/app/api/newsletter/verify/route");

    const request = new Request("http://localhost:3000/api/newsletter/verify?token=valid-token-123");

    await GET(request);

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as {
      notification: Record<string, unknown>;
    };

    expect(busEvent.notification.source).toBe("newsletter");
    expect(busEvent.notification.id).toEqual(expect.stringContaining("e2e-notif-"));
    expect(busEvent.notification.category).toBe("NEWSLETTER");
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockSubscriberUpdate).toHaveBeenCalled();
  });
});
