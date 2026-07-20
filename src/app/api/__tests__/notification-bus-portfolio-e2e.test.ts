// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Portfolio Project End-to-End Integration Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests the full pipeline from POST /api/dashboard/portfolio →
// notifyProjectPublished → sendNotification → notification-bus emit.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

const mockProjectFindUnique = vi.hoisted(() => vi.fn());
const mockProjectCreate = vi.hoisted(() => vi.fn());
const mockCaseStudyCreate = vi.hoisted(() => vi.fn());
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

// The portfolio POST route uses withActivityLog wrapper which checks auth
vi.mock("@/lib/activity-wrappers", () => ({
  withActivityLog: () => (handler: (...args: unknown[]) => unknown) => handler,
}));

vi.mock("@/lib/db", () => {
  const prismaObj = {
    portfolioProject: {
      findUnique: (...args: unknown[]) => mockProjectFindUnique(...args),
      create: (...args: unknown[]) => mockProjectCreate(...args),
    },
    caseStudy: {
      create: (...args: unknown[]) => mockCaseStudyCreate(...args),
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
    source: (data.source as string) ?? "portfolio",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: (data.sentAt as Date | null) ?? null,
    expiresAt: null,
  };
}

// ─── Bus cleanup tracking ─────────────────────────────────────────────────

const busCleanups: (() => void)[] = [];

// ─── Fixtures ───────────────────────────────────────────────────────────────

const PUBLISHED_PROJECT = {
  id: "proj-e2e-1",
  title: "My Awesome Project",
  slug: "my-awesome-project",
  shortDescription: "A cool project description",
  status: "PUBLISHED",
  published: true,
  featured: false,
  categoryId: null,
  featuredImage: null,
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
} as Record<string, unknown>;

// ═════════════════════════════════════════════════════════════════════════════
// Setup & Teardown
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });

  // No slug conflict
  mockProjectFindUnique.mockResolvedValue(null);
  mockProjectCreate.mockResolvedValue(PUBLISHED_PROJECT);
  mockCaseStudyCreate.mockResolvedValue({});

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

describe("Notification Bus E2E: POST portfolio published → bus", () => {
  it("direct emitNotification reaches the listener synchronously", async () => {
    const { onNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    emitNotification({
      notification: {
        id: "sanity-1", userId: null, category: "PORTFOLIO", priority: "MEDIUM",
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

  it("delivers a bus event when portfolio project is created with published=true", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    // Re-fetch mock for the fullProject return
    mockProjectFindUnique.mockResolvedValue(PUBLISHED_PROJECT);

    const { POST } = await import("@/app/api/dashboard/portfolio/route");

    const request = new Request("http://localhost:3000/api/dashboard/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Awesome Project",
        shortDescription: "A cool project description",
        published: true,
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
    };
    expect(busEvent.eventKey).toBe("portfolio.project.published");
    expect(busEvent.notification.source).toBe("portfolio");
    expect(busEvent.notification.title).toBe("Portfolio Published: My Awesome Project");
    expect(busEvent.notification.message).toContain("new project");
    expect(busEvent.notification.link).toBe("/dashboard/portfolio/proj-e2e-1");
    expect(busEvent.notification.category).toBe("PORTFOLIO");

    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
  });

  it("does NOT deliver a bus event when project is created with published=false", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockProjectCreate.mockResolvedValue({ ...PUBLISHED_PROJECT, published: false });

    const { POST } = await import("@/app/api/dashboard/portfolio/route");

    const request = new Request("http://localhost:3000/api/dashboard/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Awesome Project",
        published: false,
      }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- non-standard second param
    const response = await (// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
POST as any)(request, { userId: "admin-1" });

    expect(response.status).toBe(201);
    expect(busEvents).toHaveLength(0);
  });

  it("returns 400 and does NOT deliver a bus event when validation fails", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    const { POST } = await import("@/app/api/dashboard/portfolio/route");

    const request = new Request("http://localhost:3000/api/dashboard/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),  // missing required title
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- non-standard second param
    const response = await (// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
POST as any)(request, { userId: "admin-1" });

    expect(response.status).toBe(400);
    expect(busEvents).toHaveLength(0);
  });

  it("sets notification source to 'portfolio' in the bus event", async () => {
    const { onNotification } = await import("@/lib/notifications/notification-bus");
    const busEvents: unknown[] = [];
    const unsubscribe = onNotification((event) => busEvents.push(event));
    busCleanups.push(unsubscribe);

    mockProjectFindUnique.mockResolvedValue(PUBLISHED_PROJECT);

    const { POST } = await import("@/app/api/dashboard/portfolio/route");

    const request = new Request("http://localhost:3000/api/dashboard/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "My Awesome Project",
        published: true,
      }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- non-standard second param
    await (// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
POST as any)(request, { userId: "admin-1" });

    await vi.waitFor(
      () => {
        expect(busEvents).toHaveLength(1);
      },
      { timeout: 500, interval: 5 }
    );

    const busEvent = busEvents[0] as { notification: Record<string, unknown> };
    expect(busEvent.notification.source).toBe("portfolio");
    expect(busEvent.notification.id).toEqual(expect.stringContaining("e2e-notif-"));
    expect(busEvent.notification.category).toBe("PORTFOLIO");
    expect(mockNotifCreate).toHaveBeenCalled();
    expect(mockNotifLogCreate).toHaveBeenCalled();
  });
});
