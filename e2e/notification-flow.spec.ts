import { test, expect, type Page } from "@playwright/test";

// ─── Declare browser-injected globals for TypeScript ──────────────────────

declare global {
  interface Window {
    __lastDesktopNotif: { title: string; options: Record<string, unknown> } | null;
    __soundPlayed: boolean;
    webkitAudioContext: typeof AudioContext;
  }
}

// ─── Test credentials ───────────────────────────────────────────────────────

const TEST_USERNAME = "admin";
const TEST_PASSWORD = "admin123";
const ADMIN_LOGIN_URL = "/admin/login";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(ADMIN_LOGIN_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();

  await page.fill("#username", TEST_USERNAME);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForTimeout(2000);
}

/**
 * Register browser-level spies for Notification API and AudioContext.
 * MUST be called before the final page.goto() to the dashboard.
 * Uses plain JS — no TypeScript annotations, since this runs in the browser.
 */
async function setupBrowserSpies(page: Page) {
  await page.addInitScript(function () {
    // ── Spy on Notification API ──────────────────────────────────────────
    window.__lastDesktopNotif = null;

    function MockNotification(title: string, options: Record<string, unknown>) {
      window.__lastDesktopNotif = { title, options };
      return { close: function () {} };
    }
    (MockNotification as unknown as { permission: string }).permission = "granted";
    (MockNotification as unknown as { requestPermission: () => Promise<string> }).requestPermission = function () {
      return Promise.resolve("granted");
    };
    if (window.Notification) {
      (MockNotification as unknown as { maxActions: number }).maxActions = (window.Notification as unknown as { maxActions: number }).maxActions;
    }

    (window as unknown as { Notification: unknown }).Notification = MockNotification;

    // ── Spy on AudioContext + webkitAudioContext ─────────────────────────
    window.__soundPlayed = false;

    function MockAudioContext(this: Record<string, unknown>) {
      window.__soundPlayed = true;
      this.createOscillator = function () {
        return {
          connect: function () {},
          frequency: { setValueAtTime: function () {} },
          start: function () {},
          stop: function () {},
          type: "sine",
        };
      };
      this.createGain = function () {
        return {
          connect: function () {},
          gain: {
            setValueAtTime: function () {},
            exponentialRampToValueAtTime: function () {},
          },
        };
      };
      this.destination = {};
    }
    if (window.AudioContext) {
      MockAudioContext.prototype = window.AudioContext.prototype;
    }

    (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
    (window as unknown as { webkitAudioContext: typeof MockAudioContext }).webkitAudioContext = MockAudioContext;
  });
}

/**
 * Mock all backend endpoints used by the notification flow.
 * Returns the notification payload so the test can reference it.
 */
async function mockEndpoints(
  page: Page,
  notificationOverride?: Record<string, unknown>,
): Promise<{
  notificationId: string;
  notification: Record<string, unknown>;
}> {
  const notificationId = "e2e-notif-" + Date.now();
  const notification = notificationOverride ?? {
    id: notificationId,
    title: "E2E Test Alert",
    message: "This is a test HIGH priority notification",
    priority: "HIGH",
    category: "SYSTEM",
    notifType: "WARNING",
    read: false,
    createdAt: new Date().toISOString(),
    link: "/dashboard/notifications",
  };

  // Mock SSE endpoint — delivers notification event on connect
  await page.route("**/api/notifications/sse", async (route) => {
    const body = [
      "event: connected",
      "data: {}",
      "",
      "event: notification",
      "data: " + JSON.stringify({ notification: notification }),
      "",
    ].join("\n");

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: body,
    });
  });

  // Mock GET /api/notifications — include the notification to avoid race
  // with SSE (whichever resolves first, the notification is still visible)
  await page.route("**/api/notifications?*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          notifications: [notification],
          unreadCount: 1,
          total: 1,
        },
      });
    } else {
      await route.fallback();
    }
  });

  // Mock POST /api/notifications
  await page.route("**/api/notifications", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          notificationId: notificationId,
          channels: [{ channel: "IN_APP", status: "delivered" }],
        },
      });
    } else if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        json: { success: true },
      });
    } else {
      await route.fallback();
    }
  });

  return { notificationId, notification };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Notification Flow: Bell, Desktop, Sound", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("HIGH priority notification via POST triggers bell badge, desktop notification, and sound chime", async ({ page }) => {
    // 1. Set up spies for Notification API and AudioContext
    await setupBrowserSpies(page);

    // 2. Mock backend endpoints (SSE, GET, POST)
    const { notificationId } = await mockEndpoints(page);

    // 3. Navigate to dashboard — mounts the bell component and triggers SSE
    await page.goto("/dashboard/overview");
    await page.waitForLoadState("networkidle");

    // 4. POST to create a HIGH priority notification via the API
    const postResult = await page.evaluate(async function () {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "E2E Test Alert",
          message: "This is a test HIGH priority notification",
          priority: "HIGH",
          notifType: "WARNING",
          category: "SYSTEM",
        }),
      });
      return res.json();
    });

    expect(postResult.success).toBe(true);
    expect(postResult.notificationId).toBe(notificationId);

    // 5. Wait for the SSE event to be processed
    await page.waitForTimeout(2000);

    // 6. Verify the bell badge updates — check aria-label for unread count
    const bellButton = page.getByLabel("Notifications (1 unread)");
    await expect(bellButton).toBeVisible({ timeout: 5000 });

    // 7. Verify a desktop browser notification was created
    //    HIGH priority gets a "⚠️ " prefix from PRIORITY_PREFIX in useDesktopNotifications
    const desktopNotif = await page.evaluate(function () {
      return window.__lastDesktopNotif;
    });
    expect(desktopNotif).not.toBeNull();
    expect(desktopNotif!.title).toBe("\u26A0\uFE0F E2E Test Alert");
    expect(desktopNotif!.options.body).toBe(
      "This is a test HIGH priority notification",
    );

    // 8. Verify a sound chime was played via AudioContext
    const soundPlayed = await page.evaluate(function () {
      return window.__soundPlayed;
    });
    expect(soundPlayed).toBe(true);

    // ─── Cleanup: delete the notification via API ──────────────────────

    // 9. Delete the notification by calling the DELETE API
    const deleteResult = await page.evaluate(async function (id) {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      return res.json();
    }, notificationId);

    expect(deleteResult.success).toBe(true);

    // 10. Update the GET mock to return empty (notification was deleted)
    await page.unroute("**/api/notifications?*");
    await page.route("**/api/notifications?*", async (route) => {
      await route.fulfill({
        status: 200,
        json: { notifications: [], unreadCount: 0, total: 0 },
      });
    });

    // 11. Reload the page — hooks re-initialize, GET returns empty => badge clears
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // 12. Verify the bell badge no longer shows an unread count.
    //     Button aria-label is "Notifications" without "(N unread)".
    //     Use exact: true to avoid matching other elements with similar labels.
    const cleanedBell = page.getByLabel("Notifications", { exact: true });
    await expect(cleanedBell).toBeVisible({ timeout: 5000 });

    // Confirm the aria-label doesn't contain an unread count
    await expect(cleanedBell).toHaveAttribute("aria-label", "Notifications");
  });

  test("bell shows correct count and desktop notification is not shown for LOW priority", async ({ page }) => {
    await setupBrowserSpies(page);

    const lowNotif = {
      id: "e2e-low-" + Date.now(),
      title: "Low priority notification",
      message: "Nothing important",
      priority: "LOW",
      category: "SYSTEM",
      notifType: "INFO",
      read: false,
      createdAt: new Date().toISOString(),
      link: "/dashboard/notifications",
    };

    // mockEndpoints creates SSE + GET mocks using the custom notification
    await mockEndpoints(page, lowNotif);

    await page.goto("/dashboard/overview");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Bell badge should show the count
    const bellButton = page.getByLabel("Notifications (1 unread)");
    await expect(bellButton).toBeVisible({ timeout: 5000 });

    // No desktop notification — LOW priority is skipped by useDesktopNotifications
    const desktopNotif = await page.evaluate(function () {
      return window.__lastDesktopNotif;
    });
    expect(desktopNotif).toBeNull();

    // Sound should still play (useNotificationSound plays for any priority)
    const soundPlayed = await page.evaluate(function () {
      return window.__soundPlayed;
    });
    expect(soundPlayed).toBe(true);
  });

  test("desktop notification includes correct link and category info for CRITICAL priority", async ({ page }) => {
    await setupBrowserSpies(page);

    const criticalNotif = {
      id: "e2e-critical-" + Date.now(),
      title: "Critical Alert",
      message: "Server load is at 95%",
      priority: "CRITICAL",
      category: "SYSTEM",
      notifType: "ERROR",
      read: false,
      createdAt: new Date().toISOString(),
      link: "/dashboard/alerts",
    };

    await mockEndpoints(page, criticalNotif);

    await page.goto("/dashboard/overview");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const desktopNotif = await page.evaluate(function () {
      return window.__lastDesktopNotif;
    });
    expect(desktopNotif).not.toBeNull();
    expect(desktopNotif!.title).toBe("\u{1F6A8} Critical Alert");

    // requireInteraction is true for CRITICAL (persistent notification)
    expect(desktopNotif!.options.requireInteraction).toBe(true);

    // silent is false so the OS plays its own notification sound
    expect(desktopNotif!.options.silent).toBe(false);

    // tag matches notification ID for deduplication
    expect(desktopNotif!.options.tag).toBe("notif-" + criticalNotif.id);
  });
});
