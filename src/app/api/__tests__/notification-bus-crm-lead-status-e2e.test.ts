// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — CRM Lead Status Change End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from PUT /api/dashboard/crm/leads/[id] →
// notifyCrmLeadStatusChanged → sendNotification → notification-bus emit.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks ─────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

const mockLeadFindUnique = vi.hoisted(() => vi.fn());
const mockLeadUpdate = vi.hoisted(() => vi.fn());
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

vi.mock("@/lib/db", () => {
  const prismaObj = {
    crmLead: {
      findUnique: (...args: unknown[]) => mockLeadFindUnique(...args),
      update: (...args: unknown[]) => mockLeadUpdate(...args),
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

const BASE_LEAD = {
  id: "lead-status-1",
  firstName: "Bob",
  lastName: "Jones",
  email: "bob@example.com",
  phone: null,
  company: "Tech Corp",
  position: null,
  source: "website",
  status: "NEW",
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
};

const UPDATED_LEAD = {
  ...BASE_LEAD,
  status: "CONTACTED",
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
  mockLeadFindUnique.mockResolvedValue(BASE_LEAD);
  mockLeadUpdate.mockResolvedValue(UPDATED_LEAD);
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

describe("Notification Bus E2E: PUT /api/dashboard/crm/leads/[id] → notifyCrmLeadStatusChanged → bus", () => {
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

  it("delivers a bus event when lead status changes via PUT handler", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { PUT } = await import("@/app/api/dashboard/crm/leads/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/leads/lead-status-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONTACTED" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "lead-status-1" }),
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
      isUrgent: boolean;
    };
    expect(busEvent.eventKey).toBe("crm.lead.status_changed");
    // EVENT_PRIORITY_MAP: "crm.lead.status_changed" → "MEDIUM" → not urgent
    expect(busEvent.isUrgent).toBe(false);
    expect(busEvent.notification.source).toBe("crm");
    expect(busEvent.notification.category).toBe("CRM");
    expect(busEvent.notification.title).toBe("Lead Status Updated: Bob Jones");
    expect(busEvent.notification.message).toContain("NEW");
    expect(busEvent.notification.message).toContain("CONTACTED");
    expect(busEvent.notification.link).toBe("/dashboard/crm/leads/lead-status-1");

    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it("does NOT deliver a bus event when status is unchanged", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockLeadUpdate.mockResolvedValue(BASE_LEAD); // status stays "NEW"

    const { PUT } = await import("@/app/api/dashboard/crm/leads/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/leads/lead-status-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "NEW" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "lead-status-1" }) });

    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver a bus event when lead is not found", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockLeadFindUnique.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/dashboard/crm/leads/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/leads/lead-status-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONTACTED" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "lead-status-1" }),
    });

    expect(response.status).toBe(404);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver a bus event when unauthorized", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockAuth.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/dashboard/crm/leads/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/leads/lead-status-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONTACTED" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "lead-status-1" }),
    });

    expect(response.status).toBe(401);
    expect(busEvents).toHaveLength(0);
  });
});
