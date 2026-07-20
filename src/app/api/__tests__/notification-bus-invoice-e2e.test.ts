// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Invoice End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from HTTP route → event handler → sendNotification
// → notification-bus emit → listener for the CRM invoice PUT endpoint.
// Does NOT mock the event handlers or the bus — only mocks external
// dependencies (auth, prisma, resend, sentry, activity).
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

// Prisma mocks — invoice route + sendNotification
const mockInvoiceFindUnique = vi.hoisted(() => vi.fn());
const mockInvoiceUpdate = vi.hoisted(() => vi.fn());
const mockNotifCreate = vi.hoisted(() => vi.fn());
const mockNotifPrefFindUnique = vi.hoisted(() => vi.fn());
const mockNotifLogCreate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn());

// ─── Module-level mocks (hoisted) ───────────────────────────────────────────

vi.mock("@/../auth", () => ({ auth: mockAuth }));

vi.mock("@/lib/sentry", () => ({ captureError: vi.fn() }));

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({
    emails: { send: mockEmailSend },
  })),
}));

vi.mock("@/lib/email/templates", () => ({}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

// Prisma mock — covers invoice route + sendNotification + logNotificationDelivery
vi.mock("@/lib/db", () => {
  const prismaObj = {
    crmInvoice: {
      findUnique: (...args: unknown[]) => mockInvoiceFindUnique(...args),
      update: (...args: unknown[]) => mockInvoiceUpdate(...args),
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

// ─── Dynamic Prisma mock for notification.create ──────────────────────────
// Extracts actual fields from the data argument so the bus event payload
// can be verified.

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
    source: (data.source as string) ?? "crm",
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

const BASE_INVOICE = {
  id: "inv-e2e-1",
  invoiceNumber: "INV-2026-001",
  clientId: "client-1",
  client: {
    id: "client-1",
    firstName: "Alice",
    lastName: "Smith",
    email: "alice@example.com",
  },
  amount: 2500.0,
  dueDate: new Date("2026-08-15T00:00:00Z"),
  paidAt: null,
  status: "SENT",
  pdfUrl: null,
  notes: null,
  lineItems: [],
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
};

// Paid invoice fixture (returned by mockInvoiceUpdate)
const PAID_INVOICE = {
  ...BASE_INVOICE,
  status: "PAID",
  paidAt: new Date(),
};

// Overdue invoice fixture (returned by mockInvoiceUpdate)
const OVERDUE_INVOICE = {
  ...BASE_INVOICE,
  status: "OVERDUE",
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  // Auth: authenticated as admin
  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });

  // Invoice route mock: existing + default update response
  mockInvoiceFindUnique.mockResolvedValue(BASE_INVOICE);
  mockInvoiceUpdate.mockResolvedValue(BASE_INVOICE);

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

describe("Notification Bus E2E: PUT invoice PAID/OVERDUE → bus", () => {
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
        category: "CRM",
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

  it("delivers a bus event when invoice is marked as PAID via PUT handler", async () => {
    // ── 1. Subscribe to the real notification-bus ────────────────────────
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // ── 2. Mock invoice update to return PAID status ────────────────────
    mockInvoiceUpdate.mockResolvedValue(PAID_INVOICE);

    // ── 3. Import the real PUT handler ──────────────────────────────────
    const { PUT } = await import("@/app/api/dashboard/crm/invoices/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/invoices/inv-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "inv-e2e-1" }),
    });

    // ── 4. Assert HTTP response ─────────────────────────────────────────
    expect(response.status).toBe(200);

    // ── 5. Bus events are delivered asynchronously (fire-and-forget) ────
    // The route calls notifyInvoicePaid(...).catch(() => {}) — not awaited.
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
    expect(busEvent.eventKey).toBe("crm.invoice.paid");
    expect(busEvent.isUrgent).toBe(true); // EVENT_PRIORITY_MAP: "crm.invoice.paid" → HIGH
    expect(busEvent.notification.notifType).toBe("SUCCESS"); // typeOverride: "SUCCESS"
    expect(busEvent.notification.source).toBe("crm");

    // Verify the notification payload from notifyInvoicePaid
    expect(busEvent.notification.title).toBe("✅ Invoice Paid: INV-2026-001");
    expect(busEvent.notification.message).toContain("Alice Smith");
    expect(busEvent.notification.message).toContain("$2,500");
    expect(busEvent.notification.link).toBe("/dashboard/crm/invoices/inv-e2e-1");

    // Confirm sendNotification ran to completion
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it("delivers a bus event when invoice becomes OVERDUE via PUT handler", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockInvoiceUpdate.mockResolvedValue(OVERDUE_INVOICE);

    const { PUT } = await import("@/app/api/dashboard/crm/invoices/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/invoices/inv-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "OVERDUE" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "inv-e2e-1" }) });

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
    expect(busEvent.eventKey).toBe("crm.proposal.approved"); // notifyInvoiceOverdue reuses this mapping
    expect(busEvent.isUrgent).toBe(true); // priorityOverride: "HIGH"
    expect(busEvent.notification.notifType).toBe("WARNING"); // typeOverride: "WARNING"
    expect(busEvent.notification.source).toBe("crm");

    // Verify the notification payload from notifyInvoiceOverdue
    expect(busEvent.notification.title).toBe("⚠️ Invoice Overdue: INV-2026-001");
    expect(busEvent.notification.message).toContain("Alice Smith");
    expect(busEvent.notification.message).toContain("$2,500");
    expect(busEvent.notification.message).toContain("due 8/15/2026");
    expect(busEvent.notification.link).toBe("/dashboard/crm/invoices");
  });

  it("does NOT deliver a bus event when status is unchanged (already PAID)", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // Existing invoice already PAID
    mockInvoiceFindUnique.mockResolvedValue({
      ...BASE_INVOICE,
      status: "PAID",
      paidAt: new Date(),
    });

    const { PUT } = await import("@/app/api/dashboard/crm/invoices/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/invoices/inv-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "inv-e2e-1" }) });

    // No notification should fire when status hasn't changed
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver bus event when invoice is not found", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockInvoiceFindUnique.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/dashboard/crm/invoices/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/invoices/inv-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "inv-e2e-1" }) });

    expect(response.status).toBe(404);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT deliver bus event when unauthenticated", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockAuth.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/dashboard/crm/invoices/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/invoices/inv-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    const response = await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "inv-e2e-1" }) });

    expect(response.status).toBe(401);
    expect(busEvents).toHaveLength(0);
  });

  it("does NOT send email for invoice status changes (no userId on notification)", async () => {
    // The invoice notification handlers don't set a userId, so dispatchEmail
    // in sendNotification returns early with "No recipient email found" —
    // resend.emails.send is never called.
    mockInvoiceUpdate.mockResolvedValue(PAID_INVOICE);

    const { PUT } = await import("@/app/api/dashboard/crm/invoices/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/invoices/inv-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "inv-e2e-1" }) });

    // wait for fire-and-forget to settle
    await vi.waitFor(
      () => {
        expect(mockNotifCreate).toHaveBeenCalled();
      },
      { timeout: 500, interval: 5 }
    );

    // But no email should be sent — dispatchEmail bails on null userId
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("sets notification source to 'crm' in the bus event for PAID", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockInvoiceUpdate.mockResolvedValue(PAID_INVOICE);

    const { PUT } = await import("@/app/api/dashboard/crm/invoices/[id]/route");

    const request = new Request("http://localhost:3000/api/dashboard/crm/invoices/inv-e2e-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    await PUT(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "inv-e2e-1" }) });

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as {
      notification: Record<string, unknown>;
    };

    expect(busEvent.notification.source).toBe("crm");
    expect(busEvent.notification.id).toEqual(expect.stringContaining("e2e-notif-"));
    expect(busEvent.notification.category).toBe("CRM");
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
  });

});
