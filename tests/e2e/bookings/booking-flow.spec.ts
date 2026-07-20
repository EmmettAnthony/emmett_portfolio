import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test("displays available meeting types", async ({ page }) => {
    await page.goto("/book");
    await expect(page.getByText(/discovery call/i).or(page.getByText(/consultation/i))).toBeVisible();
  });

  test("shows available time slots", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: /select/i }).first().click();
    await page.getByLabel(/date/i).fill("2025-01-15");
  });

  test("submits booking form with valid data", async ({ page }) => {
    await page.goto("/book");
    await page.getByLabel(/name/i).fill("John Doe");
    await page.getByLabel(/email/i).fill("john@example.com");
    await page.getByRole("button", { name: /confirm/i }).click();
  });
});
