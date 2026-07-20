import { test, expect } from "@playwright/test";

test.describe("Newsletter Signup Form", () => {
  test.beforeEach(async ({ page }) => {
    // The NewsletterSection appears at the bottom of the contact page
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    // Scroll to the newsletter section at the bottom
    await page.getByText("Stay Updated").scrollIntoViewIfNeeded();
  });

  test("renders the newsletter signup section", async ({ page }) => {
    await expect(page.getByText("Stay Updated")).toBeVisible();
    const emailInput = page.locator('input[placeholder="you@example.com"]');
    await expect(emailInput).toBeVisible();
  });

  test("shows the name field", async ({ page }) => {
    const nameInput = page.locator('input[placeholder="Your name (optional)"]');
    await expect(nameInput).toBeVisible();
  });

  test("renders the GDPR consent checkbox", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    const privacyLink = page.getByText(/privacy policy/i);
    await expect(privacyLink).toBeVisible();
  });

  test("renders the Subscribe button", async ({ page }) => {
    const subscribeBtn = page.getByRole("button", { name: "Subscribe" });
    await expect(subscribeBtn).toBeVisible();
  });

  test("subscribe button is disabled when email is empty", async ({ page }) => {
    const subscribeBtn = page.getByRole("button", { name: "Subscribe" });
    await expect(subscribeBtn).toBeDisabled();
  });

  test("subscribe button is disabled when GDPR consent is not checked", async ({ page }) => {
    await page.locator('input[placeholder="you@example.com"]').fill("test@example.com");
    const subscribeBtn = page.getByRole("button", { name: "Subscribe" });
    await expect(subscribeBtn).toBeDisabled();
  });

  test("shows the privacy policy link", async ({ page }) => {
    const privacyLink = page.locator('a[href="/privacy"]');
    await expect(privacyLink).toBeVisible();
  });

  test("successfully subscribes with valid data", async ({ page }) => {
    await page.route("**/api/newsletter/signup", async (route) => {
      await route.fulfill({
        status: 200,
        json: { message: "Thanks for subscribing! Check your email to confirm." },
      });
    });

    await page.locator('input[placeholder="Your name (optional)"]').fill("Jane Doe");
    await page.locator('input[placeholder="you@example.com"]').fill("jane@example.com");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Subscribe" }).click();

    await expect(page.getByText("Subscribed!")).toBeVisible();
    await expect(page.getByText("Thanks for subscribing!")).toBeVisible();
  });

  test("handles already subscribed response", async ({ page }) => {
    await page.route("**/api/newsletter/signup", async (route) => {
      await route.fulfill({
        status: 200,
        json: { message: "Already subscribed" },
      });
    });

    await page.locator('input[placeholder="Your name (optional)"]').fill("Jane Doe");
    await page.locator('input[placeholder="you@example.com"]').fill("jane@example.com");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Subscribe" }).click();

    await expect(page.getByText("You're already subscribed!")).toBeVisible();
  });

  test("shows error message when API fails", async ({ page }) => {
    await page.route("**/api/newsletter/signup", async (route) => {
      await route.fulfill({
        status: 400,
        json: { error: "Invalid email address" },
      });
    });

    await page.locator('input[placeholder="you@example.com"]').fill("bad@test.com");
    await page.locator('input[type="checkbox"]').check();
    const btn = page.getByRole("button", { name: "Subscribe" });
    await expect(btn).toBeEnabled();
    await btn.click();
    await expect(page.getByText("Invalid email address")).toBeVisible({ timeout: 5000 });
  });

  test("shows rate limited message when API returns 429", async ({ page }) => {
    await page.route("**/api/newsletter/signup", async (route) => {
      await route.fulfill({
        status: 429,
        json: { error: "Too many attempts. Please try again later." },
      });
    });

    await page.locator('input[placeholder="you@example.com"]').fill("jane@example.com");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Subscribe" }).click();

    await expect(page.getByText("Too many attempts")).toBeVisible();
  });

  test("shows network error when fetch fails", async ({ page }) => {
    await page.route("**/api/newsletter/signup", async (route) => {
      await route.abort("connectionrefused");
    });

    await page.locator('input[placeholder="you@example.com"]').fill("jane@example.com");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: "Subscribe" }).click();

    await expect(page.getByText("Network error")).toBeVisible();
  });
});
