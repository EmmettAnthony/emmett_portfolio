// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — CRM Deal End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from PUT /api/dashboard/crm/deals/[id] → 
// notifyCrmDealWon/notifyCrmDealLost → sendNotification → notification-bus emit.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

const mockDealFindUnique = vi.hoisted(() => vi.fn());
const mockDealUpdate = vi.hoisted(() => vi.fn());
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
    crmDeal: {
      findUnique: (...args: unknown[]) => mockDealFindUnique(...args),
      update: (...args: unknown[]) => mockDealUpdate(...args),
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
    source: (data.source as string) ?? "crm",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: (data.sentAt as Date | null) ?? null,
    expiresAt: null,
  };
}

// ─── Bus cleanup tracking ─────────────────────────────────────────────────

const busCleanups: (() => void)[] = [];

// ─── Fixtures ───────────────────────────────────────────────────────────────

const BASE_DEAL = {
  id: "deal-e2e-1",
  name: "Enterprise Platform Deal",
  value: 50000,
  status: "NEGOTIATION",
  lostReason: null,
  clientId: "client-1",
  clientName: "Acme Corp",
  client: {
    id: "client-1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@acme.com",
  },
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
};

const WON_DEAL = {
  ...BASE_DEAL,
  status: "WON",
};

const LOST_DEAL = {
  ...BASE_DEAL,
  status: "LOST",
  lostReason: "Budget constraints",
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });

  mockDealFindUnique.mockResolvedValue(BASE_DEAL);
  mockDealUpdate.mockResolvedValue(BASE_DEAL);

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

describe("Notification Bus E2E: PUT CRM deal WON/LOST → bus", () => {
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

  it("delivers a bus event when deal status changes to WON via PUT handler", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockDealUpdate.mockResolvedValue(WON_DEAL);

    const { PUT } = await import("@/app/api/dashboard/crm/deals/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/deals/deal-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "WON" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "deal-e2e-1" }),
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
    expect(busEvent.eventKey).toBe("crm.deal.won");
    expect(busEvent.isUrgent).toBe(true); // priority maps to urgent in EVENT_PRIORITY_MAP
    expect(busEvent.notification.source).toBe("crm");
    expect(busEvent.notification.title).toBe("🎉 Deal Won: Enterprise Platform Deal");
    expect(busEvent.notification.message).toContain("Jane Doe");
    expect(busEvent.notification.message).toContain("$50,000");
    expect(busEvent.notification.link).toBe("/dashboard/crm/deals/deal-e2e-1");
    expect(busEvent.notification.category).toBe("CRM");

    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
  });

  it("delivers a bus event when deal status changes to LOST via PUT handler", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockDealUpdate.mockResolvedValue(LOST_DEAL);

    const { PUT } = await import("@/app/api/dashboard/crm/deals/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/deals/deal-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LOST", lostReason: "Budget constraints" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "deal-e2e-1" }) });

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
    expect(busEvent.eventKey).toBe("crm.deal.lost");
    expect(busEvent.notification.title).toBe("Deal Lost: Enterprise Platform Deal");
    expect(busEvent.notification.message).toContain("$50,000");
    expect(busEvent.notification.message).toContain("Budget constraints");
    expect(busEvent.notification.source).toBe("crm");
  });

  it("does NOT deliver a bus event when status is unchanged", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockDealFindUnique.mockResolvedValue({ ...BASE_DEAL, status: "WON" });
    mockDealUpdate.mockResolvedValue({ ...BASE_DEAL, status: "WON" });

    const { PUT } = await import("@/app/api/dashboard/crm/deals/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/deals/deal-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "WON" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "deal-e2e-1" }) });

    expect(busEvents).toHaveLength(0);
  });

  it("returns 404 and does NOT deliver bus event when deal not found", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockDealFindUnique.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/dashboard/crm/deals/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/deals/deal-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "WON" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "deal-e2e-1" }) });

    expect(response.status).toBe(404);
    expect(busEvents).toHaveLength(0);
  });

  it("returns 401 and does NOT deliver bus event when unauthenticated", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockAuth.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/dashboard/crm/deals/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/deals/deal-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "WON" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "deal-e2e-1" }) });

    expect(response.status).toBe(401);
    expect(busEvents).toHaveLength(0);
  });

  it("sets notification source to 'crm' in the bus event", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockDealUpdate.mockResolvedValue(WON_DEAL);

    const { PUT } = await import("@/app/api/dashboard/crm/deals/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/deals/deal-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "WON" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "deal-e2e-1" }) });

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as { notification: Record<string, unknown> };
    expect(busEvent.notification.source).toBe("crm");
    expect(busEvent.notification.id).toEqual(expect.stringContaining("e2e-notif-"));
    expect(busEvent.notification.category).toBe("CRM");
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
  });
});
