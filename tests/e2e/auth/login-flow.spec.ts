import { test, expect, type Page } from "@playwright/test";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
  });

  test("renders login page with all elements", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors for empty form", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i).or(page.getByText(/required/i)).first()).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i).or(page.getByText(/failed/i))).toBeVisible({ timeout: 10000 });
  });

  test("navigates to forgot password page", async ({ page }) => {
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });
});

test.describe("Authenticated Access", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/admin/dashboard/overview");
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("redirects to dashboard after successful login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel(/email/i).fill(process.env.TEST_ADMIN_EMAIL ?? "admin@test.com");
    await page.getByLabel(/password/i).fill(process.env.TEST_ADMIN_PASSWORD ?? "password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});
