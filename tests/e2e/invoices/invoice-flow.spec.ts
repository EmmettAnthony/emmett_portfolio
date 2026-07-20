import { test, expect } from "@playwright/test";

test.describe("Invoice Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/email/i).fill(process.env.TEST_ADMIN_EMAIL ?? "admin@test.com");
    await page.getByLabel(/password/i).fill(process.env.TEST_ADMIN_PASSWORD ?? "password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  test("displays invoice list", async ({ page }) => {
    await page.goto("/admin/dashboard/invoices");
    await expect(page.getByRole("heading", { name: /invoices/i })).toBeVisible();
  });

  test("can create a new invoice", async ({ page }) => {
    await page.goto("/admin/dashboard/invoices");
    await page.getByRole("button", { name: /create invoice/i }).click();

    await page.getByLabel(/customer/i).fill("Test Customer");
    await page.getByLabel(/email/i).fill("customer@test.com");
    await page.getByLabel(/amount/i).fill("1500");
    await page.getByRole("button", { name: /save/i, exact: true }).click();
  });
});
