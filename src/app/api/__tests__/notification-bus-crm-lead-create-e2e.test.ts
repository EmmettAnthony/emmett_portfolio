// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — CRM Lead Create End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from POST /api/dashboard/crm/leads →
// notifyCrmLeadCreated → sendNotification → notification-bus emit → listener.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks ─────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

const mockLeadCreate = vi.hoisted(() => vi.fn());
const mockNotifCreate = vi.hoisted(() => vi.fn());
const mockNotifPrefFindUnique = vi.hoisted(() => vi.fn());
const mockNotifLogCreate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn());

// ─── Module-level mocks ───────────────────────────────────────────────────

vi.mock("@/../auth", () => ({ auth: mockAuth }));

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({ emails: { send: mockEmailSend } })),
}));

vi.mock("@/lib/sentry", () => ({ captureError: vi.fn() }));

vi.mock("@/lib/activity", () => ({ logActivity: mockLogActivity }));

vi.mock("@/lib/activity-wrappers", () => ({
  withActivityLog: () => (handler: (...args: unknown[]) => unknown) => handler,
}));

vi.mock("@/lib/db", () => {
  const prismaObj = {
    crmLead: {
      create: (...args: unknown[]) => mockLeadCreate(...args),
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
  return { getPrisma: vi.fn(() => prismaObj), prisma: prismaObj };
});

// ─── Dynamic notification.create mock ─────────────────────────────────────

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
    source: (data.source as string) ?? "crm",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: (data.sentAt as Date | null) ?? null,
    expiresAt: null,
  };
}

// ─── Bus cleanup tracking ─────────────────────────────────────────────────

const busCleanups: (() => void)[] = [];

// ─── Fixtures ─────────────────────────────────────────────────────────────

const CREATED_LEAD = {
  id: "lead-1",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  phone: null,
  company: "Acme Corp",
  position: null,
  source: "contact_form",
  status: "NEW",
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
  mockLeadCreate.mockResolvedValue(CREATED_LEAD);
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

describe("Notification Bus E2E: POST /api/dashboard/crm/leads → notifyCrmLeadCreated → bus", () => {
  it("direct emitNotification reaches the listener synchronously", async () => {
    const { onNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    emitNotification({
      notification: {
        id: "sanity-1", userId: null, category: "CRM", priority: "MEDIUM",
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

  it("delivers a bus event when a CRM lead is created", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { POST } = await import("@/app/api/dashboard/crm/leads/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        company: "Acme Corp",
        source: "contact_form",
      }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- non-standard second param
const response = await (// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
POST as any)(request, { userId: "admin-1" });

    expect(response.status).toBe(201);

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
    expect(busEvent.eventKey).toBe("crm.lead.created");
    // EVENT_PRIORITY_MAP: "crm.lead.created" → "MEDIUM" → not urgent
    expect(busEvent.isUrgent).toBe(false);
    expect(busEvent.notification.source).toBe("crm");
    expect(busEvent.notification.category).toBe("CRM");
    expect(busEvent.notification.title).toBe("New CRM Lead: Alice Smith");
    expect(busEvent.notification.message).toContain("alice@example.com");
    expect(busEvent.notification.message).toContain("contact_form");
    expect(busEvent.notification.link).toBe("/dashboard/crm/leads/lead-1");

    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalled();
  });

});
