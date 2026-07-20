import { test, expect, type Page } from "@playwright/test";

test.describe("Newsletter Popup — Per-Page Config", () => {
  const POPUP_TEXT = "Never Miss an Update";
  const TRIGGER_SELECTOR = "[data-popup-trigger='newsletter']";
  const VIEWPORT = { width: 375, height: 667 };

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  /** Navigate to a page, clear storage, scroll to trigger, and check popup state. */
  async function verifyPopup(page: Page, url: string, shouldAppear: boolean) {
    await page.goto(url, { waitUntil: "networkidle" });

    // Clear all session/local storage so the popup isn't suppressed
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.waitForTimeout(2000);

    // Verify the trigger element exists in the DOM
    const triggerCount = await page.locator(TRIGGER_SELECTOR).count();
    expect(triggerCount).toBeGreaterThanOrEqual(1);

    // Scroll to the very bottom of the page to trigger the popup
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(5000);

    // Check if popup appeared
    const hasPopup = await page.locator("text=" + POPUP_TEXT).isVisible();

    if (shouldAppear) {
      expect(hasPopup).toBe(true);
    } else {
      expect(hasPopup).toBe(false);
    }
  }

  test.describe("Popup should appear", () => {
    test("Services page — popup appears on scroll to footer", async ({ page }) => {
      await verifyPopup(page, "/services", true);
    });

    test("Blog page — popup appears on scroll to footer", async ({ page }) => {
      await verifyPopup(page, "/blog", true);
    });

    test("Contact page — popup appears on scroll to footer", async ({ page }) => {
      await verifyPopup(page, "/contact", true);
    });

    test("About page — popup appears on scroll to footer", async ({ page }) => {
      await verifyPopup(page, "/about", true);
    });
  });

  test.describe("Popup should NOT appear", () => {
    test("Home page — popup blocked by per-page config", async ({ page }) => {
      await verifyPopup(page, "/", false);
    });

    test("Portfolio page — popup blocked by per-page config", async ({ page }) => {
      await verifyPopup(page, "/portfolio", false);
    });

    test("Resume page — popup blocked by per-page config", async ({ page }) => {
      await verifyPopup(page, "/resume", false);
    });
  });

  test.describe("Popup dismissal", () => {
    test("dismissing the popup sets localStorage flag and prevents re-show", async ({ page }) => {
      await page.goto("/services", { waitUntil: "networkidle" });
      await page.evaluate(() => {
        sessionStorage.clear();
        localStorage.clear();
      });
      await page.waitForTimeout(2000);

      // Scroll to bottom to trigger popup
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(5000);

      // Close the popup by clicking the backdrop
      const popup = page.locator("text=" + POPUP_TEXT);
      await expect(popup).toBeVisible({ timeout: 3000 });
      await page.locator(".fixed.inset-0").first().click({ force: true });
      await page.waitForTimeout(500);

      // Verify localStorage flag was set
      const dismissed = await page.evaluate(
        () => localStorage.getItem("newsletter-popup-dismissed") === "true"
      );
      expect(dismissed).toBe(true);

      // Refresh and scroll again — popup should NOT re-appear
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(5000);

      const reappeared = await page.locator("text=" + POPUP_TEXT).isVisible();
      expect(reappeared).toBe(false);
    });
  });

  test.describe("Viewport resize behavior", () => {
    test("loading at desktop width then resizing to mobile triggers scroll-based popup", async ({ page }) => {
      // Override viewport to desktop width (beforeEach set mobile)
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/services", { waitUntil: "networkidle" });
      await page.evaluate(() => {
        sessionStorage.clear();
        localStorage.clear();
      });
      await page.waitForTimeout(2000);

      // Resize to mobile width — should swap trigger to IntersectionObserver
      await page.setViewportSize(VIEWPORT);
      await page.waitForTimeout(1000);

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(5000);

      const hasPopup = await page.locator("text=" + POPUP_TEXT).isVisible();
      expect(hasPopup).toBe(true);
    });
  });
});
