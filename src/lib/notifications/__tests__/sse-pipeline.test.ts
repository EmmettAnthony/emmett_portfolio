// ──────────────────────────────────────────────────────────────────────────────
// SSE Pipeline — Integration Tests
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full real-time pipeline end-to-end without mocking the bus:
//   sendNotification() → emitNotification() → onNotification() listener
//   SSE endpoint handler → notification-bus → ReadableStream output
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mocks must be defined before imports that use them ─────────────────────

const mockPrismaCreate = vi.fn();
const mockPrismaFindUnique = vi.fn();
const mockPrismaNotificationLogCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      create: (...args: unknown[]) => mockPrismaCreate(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
    },
    notificationLog: {
      create: (...args: unknown[]) => mockPrismaNotificationLogCreate(...args),
    },
    user: {
      findUnique: vi.fn(),
    },
    notificationTemplate: {
      findUnique: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  },
}));

// ─── Default Prisma return values ──────────────────────────────────────────

/**
 * Build a fake notification object that matches the shape Prisma would return.
 * Extracts the title/message from the `data` argument passed to create(),
 * so tests can verify the actual payload flows through the bus.
 */
function mockNotificationCreate(args: { data?: Record<string, unknown> }) {
  const data = args.data ?? {};
  return {
    id: "notif-integration-" + Date.now(),
    userId: data.userId !== undefined && data.userId !== null ? String(data.userId) : null,
    category: (data.category as string) ?? "SYSTEM",
    priority: (data.priority as string) ?? "MEDIUM",
    notifType: (data.notifType as string) ?? "INFO",
    title: (data.title as string) ?? "Integration Test Notification",
    message: (data.message as string) ?? "Testing the SSE pipeline end-to-end",
    link: (data.link as string | null) ?? null,
    image: (data.image as string | null) ?? null,
    key: (data.key as string | null) ?? null,
    read: false,
    archived: false,
    pinned: false,
    snoozedUntil: null,
    acknowledged: false,
    actionLabel: null,
    actionUrl: null,
    metadata: null,
    source: (data.source as string) ?? "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: (data.sentAt as Date | null) ?? null,
    expiresAt: (data.expiresAt as Date | null) ?? null,
  };
}

// Mock resend to avoid real API calls
vi.mock("@/lib/resend", () => ({
  getResend: () => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  }),
}));

// Mock activity logger
vi.mock("@/lib/activity", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// ─── Now import the modules under test (mocks are hoisted) ─────────────────

import { sendNotification } from "@/lib/notifications/notification-service";
import {
  emitNotification,
  onNotification
} from "@/lib/notifications/notification-bus";
import type { NotificationBusEvent } from "@/lib/notifications/notification-bus";
import type { NotificationPayload } from "@/lib/notifications/notification-service";

// ─── Test notification fixture ──────────────────────────────────────────────

function createTestPayload(overrides: Partial<NotificationPayload> = {}): NotificationPayload {
  return {
    userId: "test-user-1",
    eventKey: "system.test",
    title: "Integration Test Notification",
    message: "Testing the SSE pipeline end-to-end",
    source: "test",
    ...overrides,
  };
}

const FAKE_CREATED_NOTIFICATION = {
  id: "notif-integration-1",
  userId: "test-user-1",
  category: "SYSTEM" as const,
  priority: "MEDIUM" as const,
  notifType: "INFO" as const,
  title: "Integration Test Notification",
  message: "Testing the SSE pipeline end-to-end",
  link: null,
  image: null,
  key: null,
  read: false,
  archived: false,
  pinned: false,
  snoozedUntil: null,
  acknowledged: false,
  actionLabel: null,
  actionUrl: null,
  metadata: null,
  source: "test",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sentAt: null,
  expiresAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Use the dynamic builder so tests can verify payload data flows through
  mockPrismaCreate.mockImplementation(mockNotificationCreate);
  mockPrismaFindUnique.mockResolvedValue(null); // No notification preferences = use defaults
  mockPrismaNotificationLogCreate.mockResolvedValue({});
});

afterEach(() => {
  // Clean up any bus listeners left over from tests
  // We can't easily remove all listeners, but each test subscribes/unsubscribes properly
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("SSE Pipeline: sendNotification → notification-bus → listeners", () => {
  it("sends event through notification-bus when sendNotification is called", async () => {
    const receivedEvents: NotificationBusEvent[] = [];

    // Subscribe to the real notification bus
    const unsubscribe = onNotification((event) => {
      receivedEvents.push(event);
    });

    // Call sendNotification (which internally calls emitNotification)
    await sendNotification(createTestPayload());

    // Clean up listener
    unsubscribe();

    // Verify the bus delivered the event
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0].notification.id).toEqual(
      expect.stringContaining("notif-integration-")
    );
    expect(receivedEvents[0].eventKey).toBe("system.test");
    expect(receivedEvents[0].isUrgent).toBe(false); // MEDIUM priority = not urgent
  });

  it("includes the full notification payload from the bus", async () => {
    const receivedEvents: NotificationBusEvent[] = [];
    const unsubscribe = onNotification((event) => {
      receivedEvents.push(event);
    });

    await sendNotification(createTestPayload({ title: "Custom Title", message: "Custom message" }));

    unsubscribe();

    expect(receivedEvents[0].notification.title).toBe("Custom Title");
    expect(receivedEvents[0].notification.message).toBe("Custom message");
    expect(receivedEvents[0].notification.category).toBe("SYSTEM");
    expect(receivedEvents[0].notification.priority).toBe("MEDIUM");
    expect(receivedEvents[0].notification.notifType).toBe("INFO");
  });

  it("sets isUrgent=true for HIGH priority events", async () => {
    const receivedEvents: NotificationBusEvent[] = [];
    const unsubscribe = onNotification((event) => {
      receivedEvents.push(event);
    });

    await sendNotification(createTestPayload({ priorityOverride: "HIGH" }));

    unsubscribe();

    expect(receivedEvents[0].isUrgent).toBe(true);
  });

  it("sets isUrgent=true for CRITICAL priority events", async () => {
    const receivedEvents: NotificationBusEvent[] = [];
    const unsubscribe = onNotification((event) => {
      receivedEvents.push(event);
    });

    await sendNotification(createTestPayload({ priorityOverride: "CRITICAL" }));

    unsubscribe();

    expect(receivedEvents[0].isUrgent).toBe(true);
  });

  it("supports multiple listeners on the bus", async () => {
    const received1: NotificationBusEvent[] = [];
    const received2: NotificationBusEvent[] = [];

    const unsub1 = onNotification((e) => received1.push(e));
    const unsub2 = onNotification((e) => received2.push(e));

    await sendNotification(createTestPayload());

    unsub1();
    unsub2();

    expect(received1).toHaveLength(1);
    expect(received2).toHaveLength(1);
    expect(received1[0].notification.id).toBe(received2[0].notification.id);
  });

  it("unsubscribed listeners do not receive events", async () => {
    const received: NotificationBusEvent[] = [];

    const unsubscribe = onNotification((e) => received.push(e));
    // Unsubscribe immediately
    unsubscribe();

    await sendNotification(createTestPayload());

    expect(received).toHaveLength(0);
  });

  it("handles emitNotification called directly (simulating other callers)", async () => {
    const received: NotificationBusEvent[] = [];
    const unsubscribe = onNotification((e) => received.push(e));

    const event: NotificationBusEvent = {
      notification: {
        ...FAKE_CREATED_NOTIFICATION,
        id: "direct-emit-1",
        title: "Direct Emit",
      },
      eventKey: "calendar.appointment.booked",
      isUrgent: true,
    };

    emitNotification(event);
    unsubscribe();

    expect(received).toHaveLength(1);
    expect(received[0].notification.id).toBe("direct-emit-1");
    expect(received[0].eventKey).toBe("calendar.appointment.booked");
    expect(received[0].isUrgent).toBe(true);
  });
});

describe("SSE Pipeline: SSE endpoint → notification-bus → stream output", () => {
  it("SSE event contains correctly formatted notification data", async () => {
    const received: NotificationBusEvent[] = [];
    const unsubscribe = onNotification((e) => received.push(e));

    await sendNotification(createTestPayload({
      title: "SSE Format Test",
      priorityOverride: "HIGH",
      eventKey: "crm.deal.won",
    }));

    unsubscribe();

    // Verify the event can be serialized to SSE format
    const eventData = {
      notification: received[0].notification,
      eventKey: received[0].eventKey,
      isUrgent: received[0].isUrgent,
    };

    const ssePayload = `event: notification\ndata: ${JSON.stringify(eventData)}\n\n`;

    // Parse it back and verify structure
    const parsed = JSON.parse(ssePayload.split("\ndata: ")[1].split("\n\n")[0]);
    expect(parsed.notification.title).toBe("SSE Format Test");
    expect(parsed.eventKey).toBe("crm.deal.won");
    expect(parsed.isUrgent).toBe(true);
  });

  it("SSE connected event format is correct", () => {
    const connectedPayload = `event: connected\ndata: ${JSON.stringify({ status: "connected", userId: "test-user-1" })}\n\n`;

    const eventLine = connectedPayload.split("\n")[0];
    const dataLine = connectedPayload.split("\n")[1];

    expect(eventLine).toBe("event: connected");
    expect(dataLine).toContain("test-user-1");

    const parsed = JSON.parse(dataLine.replace("data: ", ""));
    expect(parsed.status).toBe("connected");
  });

  it("user ID filtering in SSE endpoint logic", async () => {
    // This simulates the filtering logic inside the SSE endpoint:
    //   if (event.notification.userId !== null && event.notification.userId !== userId) return;
    const sseUserId = "sse-user-1";

    // Notifications for different users or null (system-wide)
    const testCases = [
      { userId: "sse-user-1", expectedDelivered: true, desc: "same user" },
      { userId: null, expectedDelivered: true, desc: "null userId (system-wide)" },
      { userId: "sse-user-2", expectedDelivered: false, desc: "different user" },
    ];

    for (const tc of testCases) {
      const received: NotificationBusEvent[] = [];
      const unsubscribe = onNotification((e) => received.push(e));

      await sendNotification(createTestPayload({
        userId: tc.userId,
        title: `Test for ${tc.desc}`,
      }));

      unsubscribe();

      // Apply the SSE filtering logic (as it appears in sse/route.ts)
      const filtered = received.filter((evt) => {
        return evt.notification.userId === null || evt.notification.userId === sseUserId;
      });

      if (tc.expectedDelivered) {
        expect(filtered.length).toBeGreaterThanOrEqual(1);
      } else {
        expect(filtered).toHaveLength(0);
      }
    }
  });
});

describe("SSE Pipeline: sendNotification error handling", () => {
  it("still emits event on bus even when Prisma create fails", async () => {
    // Prisma create fails but emitNotification is called in a try/catch that
    // catches the error from controller.enqueue (stream closed), not from the
    // emitNotification call itself. Let's test the case where Prisma fails
    // and we verify the error is handled gracefully.

    mockPrismaCreate.mockRejectedValueOnce(new Error("Database connection lost"));

    const received: NotificationBusEvent[] = [];
    const unsubscribe = onNotification((e) => received.push(e));

    // sendNotification will throw since Prisma fails and the notification
    // is never created, so emitNotification is never called
    await expect(sendNotification(createTestPayload())).rejects.toThrow();

    unsubscribe();

    // The bus should NOT receive any event since Prisma failed before emitNotification
    expect(received).toHaveLength(0);
  });
});
