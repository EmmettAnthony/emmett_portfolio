import { test, expect } from "@playwright/test";

test.describe("Support Ticket Flow", () => {
  test("creates a support ticket from public page", async ({ page }) => {
    await page.goto("/support/new");
    await expect(page.getByRole("heading", { name: /submit a ticket/i })).toBeVisible();

    await page.getByLabel(/subject/i).fill("Test support issue");
    await page.getByLabel(/message/i).fill("I am having trouble with my account login. The page keeps timing out.");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/name/i).fill("Test User");
    await page.getByRole("button", { name: /submit/i }).click();
  });

  test("shows validation for empty ticket form", async ({ page }) => {
    await page.goto("/support/new");
    await page.getByRole("button", { name: /submit/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible({ timeout: 5000 });
  });
});
