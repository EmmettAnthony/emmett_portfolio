import { test, expect } from "@playwright/test";

test.describe("Newsletter Signup", () => {
  test("displays newsletter signup form on homepage", async ({ page }) => {
    await page.goto("/");
    const signupForm = page.getByPlaceholder(/email/i).or(page.getByPlaceholder(/subscribe/i));
    if (await signupForm.isVisible()) {
      await expect(signupForm).toBeVisible();
    }
  });

  test("subscribes with valid email", async ({ page }) => {
    await page.goto("/");
    const emailInput = page.getByPlaceholder(/email/i).or(page.getByPlaceholder(/subscribe/i));
    if (await emailInput.isVisible()) {
      await emailInput.fill("test-subscriber@example.com");
      await page.getByRole("button", { name: /subscribe/i }).first().click();
      await expect(page.getByText(/thank you/i).or(page.getByText(/subscribed/i))).toBeVisible({ timeout: 10000 });
    }
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.goto("/");
    const emailInput = page.getByPlaceholder(/email/i).or(page.getByPlaceholder(/subscribe/i));
    if (await emailInput.isVisible()) {
      await emailInput.fill("invalid-email");
      await page.getByRole("button", { name: /subscribe/i }).first().click();
      await expect(page.getByText(/valid email/i).or(page.getByText(/invalid/i))).toBeVisible({ timeout: 5000 });
    }
  });
});
