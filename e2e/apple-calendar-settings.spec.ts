import { test, expect } from "@playwright/test";

const TEST_USERNAME = "admin";
const TEST_PASSWORD = "admin123";
const ADMIN_LOGIN_URL = "/admin/login";

// ── Mock Data ───────────────────────────────────────────────────────────────

const DISCONNECTED = {
  integrations: [],
  google: { connected: false, syncEnabled: false },
  outlook: { connected: false, syncEnabled: false },
  apple: { connected: false, syncEnabled: false },
  authUrl: null,
  outlookAuthUrl: null,
};

const CONNECTED_APPLE = {
  integrations: [
    {
      id: "apple-integration-1",
      provider: "APPLE",
      email: "test@icloud.com",
      calendarName: "iCloud Calendar",
      syncEnabled: true,
      syncDirection: "EXPORT",
      lastSyncedAt: "2026-06-22T12:00:00.000Z",
    },
  ],
  google: { connected: false, syncEnabled: false },
  outlook: { connected: false, syncEnabled: false },
  apple: {
    connected: true,
    email: "test@icloud.com",
    calendarName: "iCloud Calendar",
    lastSyncedAt: "2026-06-22T12:00:00.000Z",
    syncEnabled: true,
  },
  authUrl: null,
  outlookAuthUrl: null,
};

const CONNECT_SUCCESS = {
  success: true,
  integrationId: "apple-integration-1",
  email: "test@icloud.com",
  calendarName: "iCloud Calendar",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function login(page: import("@playwright/test").Page) {
  await page.goto(ADMIN_LOGIN_URL);
  await page.waitForLoadState("networkidle");

  // Verify we're on the login page
  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();

  await page.fill("#username", TEST_USERNAME);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");

  // Give NextAuth time to set the session cookie via signIn response
  await page.waitForTimeout(2000);

  // Navigate directly to dashboard — the session cookie from signIn is now available
  await page.goto("/dashboard/overview");
  await page.waitForLoadState("networkidle");

  // If the server redirected us back to login, authentication failed
  if (page.url().includes("/admin/login")) {
    // Try to read the error message from the login form
    const errText = page.getByText("Invalid username or password");
    const msg = (await errText.isVisible().catch(() => false))
      ? "Invalid username or password"
      : "still on login page after submit";
    throw new Error(`Login failed: ${msg}`);
  }
}

/**
 * Register a route handler for integrations that overrides any previous handler
 * for the same URL pattern by calling page.unroute() first.
 */
async function mockIntegrations(
  page: import("@playwright/test").Page,
  handler: (route: import("@playwright/test").Route) => void | Promise<void>,
): Promise<void>;
async function mockIntegrations(
  page: import("@playwright/test").Page,
  data: unknown,
): Promise<void>;
async function mockIntegrations(
  page: import("@playwright/test").Page,
  dataOrHandler: unknown | ((route: import("@playwright/test").Route) => void | Promise<void>),
): Promise<void> {
  await page.unroute("**/api/calendar/integrations");
  await page.route("**/api/calendar/integrations", async (route) => {
    if (typeof dataOrHandler === "function") {
      await (dataOrHandler as (route: import("@playwright/test").Route) => void | Promise<void>)(route);
    } else {
      await route.fulfill({ json: dataOrHandler });
    }
  });
}

async function openIntegrationsTab(page: import("@playwright/test").Page) {
  await page.goto("/dashboard/calendar/settings");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Integrations" }).click();
  await page.waitForLoadState("networkidle");
}

// ── Tests ───────────────────────────────────────────────────────────────────

test.describe("Apple Calendar Integration Settings", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── Disconnected State (inline form) ─────────────────────────────────

  test.describe("Disconnected state", () => {
    test.beforeEach(async ({ page }) => {
      await mockIntegrations(page, DISCONNECTED);
      await openIntegrationsTab(page);
    });

    test("renders the Integrations tab with Apple Calendar section", async ({ page }) => {
      await expect(page.getByText("Calendar Integrations")).toBeVisible();
      await expect(page.getByText("Apple Calendar")).toBeVisible();
    });

    test("shows the inline form with Apple ID and password inputs", async ({ page }) => {
      await expect(page.getByText("iCloud CalDAV with app-specific password")).toBeVisible();
      await expect(page.getByPlaceholder("you@icloud.com")).toBeVisible();
      await expect(page.getByPlaceholder("xxxx-xxxx-xxxx-xxxx")).toBeVisible();
    });

    test("Connect button is disabled when inputs are empty", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Connect" })).toBeDisabled();
    });

    test("Connect button enables when both fields are filled", async ({ page }) => {
      const connectBtn = page.getByRole("button", { name: "Connect" });
      await expect(connectBtn).toBeDisabled();

      await page.getByPlaceholder("you@icloud.com").fill("test@icloud.com");
      await expect(connectBtn).toBeDisabled();

      await page.getByPlaceholder("xxxx-xxxx-xxxx-xxxx").fill("abcd-efgh-ijkl-mnop");
      await expect(connectBtn).toBeEnabled();
    });

    test("has a link to generate app-specific passwords", async ({ page }) => {
      const link = page.getByRole("link", { name: /Generate app-specific password/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "https://appleid.apple.com/account/manage");
      await expect(link).toHaveAttribute("target", "_blank");
    });

    test("shows helper text explaining the Apple Calendar flow", async ({ page }) => {
      await expect(
        page.getByText(/Generate an app-specific password.*then enter your Apple ID/i),
      ).toBeVisible();
    });

    test("password input has show/hide toggle", async ({ page }) => {
      const pwInput = page.getByPlaceholder("xxxx-xxxx-xxxx-xxxx");
      await pwInput.fill("visible-test-password");

      await expect(pwInput).toHaveAttribute("type", "password");

      // Toggle button is a child of the input's parent div (the relative wrapper)
      const toggleBtn = pwInput.locator("..").locator("button");
      await toggleBtn.click();
      await expect(pwInput).toHaveAttribute("type", "text");

      // Click again to hide
      await toggleBtn.click();
      await expect(pwInput).toHaveAttribute("type", "password");
    });
  });

  // ─── Connection Flow ──────────────────────────────────────────────────

  test.describe("Connection flow", () => {
    test.beforeEach(async ({ page }) => {
      await mockIntegrations(page, DISCONNECTED);
      await openIntegrationsTab(page);
    });

    test("connects successfully with valid credentials", async ({ page }) => {
      // Mock the Apple connect endpoint
      await page.route("**/api/calendar/integrations/apple/connect", async (route) => {
        await route.fulfill({ status: 200, json: CONNECT_SUCCESS });
      });
      // After connect, component re-fetches integrations — return connected state
      await mockIntegrations(page, CONNECTED_APPLE);

      await page.getByPlaceholder("you@icloud.com").fill("test@icloud.com");
      await page.getByPlaceholder("xxxx-xxxx-xxxx-xxxx").fill("abcd-efgh-ijkl-mnop");
      await page.getByRole("button", { name: "Connect" }).click();

      await expect(page.getByText("test@icloud.com")).toBeVisible({ timeout: 5000 });
    });

    test("shows error when connection fails", async ({ page }) => {
      await page.route("**/api/calendar/integrations/apple/connect", async (route) => {
        await route.fulfill({
          status: 401,
          json: {
            error:
              "Could not connect to iCloud. Verify your Apple ID and app-specific password are correct.",
          },
        });
      });

      await page.getByPlaceholder("you@icloud.com").fill("wrong@icloud.com");
      await page.getByPlaceholder("xxxx-xxxx-xxxx-xxxx").fill("invalid-password");
      await page.getByRole("button", { name: "Connect" }).click();

      await expect(page.getByText(/Could not connect to iCloud/i)).toBeVisible();
    });

    test("clears error when user types after failed connection", async ({ page }) => {
      await page.route("**/api/calendar/integrations/apple/connect", async (route) => {
        await route.fulfill({
          status: 401,
          json: {
            error:
              "Could not connect to iCloud. Verify your Apple ID and app-specific password are correct.",
          },
        });
      });

      await page.getByPlaceholder("you@icloud.com").fill("wrong@icloud.com");
      await page.getByPlaceholder("xxxx-xxxx-xxxx-xxxx").fill("invalid-password");
      await page.getByRole("button", { name: "Connect" }).click();
      await expect(page.getByText(/Could not connect to iCloud/i)).toBeVisible();

      // Typing in either input clears the error via onChange -> setAppleConnectError(null)
      await page.getByPlaceholder("you@icloud.com").fill("correct@icloud.com");
      await expect(page.getByText(/Could not connect to iCloud/i)).not.toBeVisible();
    });
  });

  // ─── Connected State ──────────────────────────────────────────────────

  test.describe("Connected state", () => {
    test.beforeEach(async ({ page }) => {
      await mockIntegrations(page, CONNECTED_APPLE);
      await openIntegrationsTab(page);
    });

    test("shows connected email and last synced time", async ({ page }) => {
      await expect(page.getByText("test@icloud.com")).toBeVisible();
      await expect(page.getByText(/Last synced:/)).toBeVisible();
    });

    test("Sync Now button performs a sync and shows results toast", async ({ page }) => {
      await page.route("**/api/calendar/integrations/*/sync", async (route) => {
        await route.fulfill({ status: 200, json: { created: 2, updated: 1, failed: 0 } });
      });

      await page.getByRole("button", { name: "Sync Now" }).click();
      await expect(page.getByText(/Synced:/)).toBeVisible({ timeout: 5000 });
    });

    test("shows error toast when sync API fails", async ({ page }) => {
      await page.route("**/api/calendar/integrations/*/sync", async (route) => {
        await route.fulfill({ status: 500, json: { error: "Sync failed" } });
      });

      await page.getByRole("button", { name: "Sync Now" }).click();
      await expect(page.getByText(/sync failed/i)).toBeVisible({ timeout: 5000 });
    });

    test("Disconnect button disconnects and returns to inline form", async ({ page }) => {
      // The disconnect flow:
      // 1. Component fetches integrations (GET) -> must return integration list with apple item
      // 2. Sends DELETE to /api/calendar/integrations/{id}
      // 3. On success, invalidates query -> re-fetches integrations -> returns DISCONNECTED

      // Clear the beforeEach handler, then set up a counting handler for GET only
      let fetchCount = 0;
      await page.unroute("**/api/calendar/integrations");
      await page.route("**/api/calendar/integrations", async (route) => {
        if (route.request().method() === "GET") {
          fetchCount++;
          if (fetchCount <= 1) {
            // First GET: return connected (component finds the integration ID to delete)
            await route.fulfill({ json: CONNECTED_APPLE });
          } else {
            // Subsequent GETs (after disconnect): return disconnected
            await route.fulfill({ json: DISCONNECTED });
          }
        } else {
          // POST/DELETE/etc. fall through to more specific handlers
          await route.fallback();
        }
      });

      // Mock the DELETE endpoint for the integration
      await page.route("**/api/calendar/integrations/*", async (route) => {
        if (route.request().method() === "DELETE") {
          await route.fulfill({ status: 200, json: {} });
        } else {
          await route.fallback();
        }
      });

      // Dismiss the browser confirmation dialog "Disconnect Apple Calendar? ..."
      page.on("dialog", (dialog) => dialog.accept());

      await page.getByRole("button", { name: "Disconnect" }).click();
      await expect(page.getByPlaceholder("you@icloud.com")).toBeVisible({ timeout: 5000 });
    });
  });
});
