import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to ensure dark mode before page loads
    await page.goto("/");
    // Store the theme preference so it persists across navigation
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
  });

  test("starts with dark mode by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("toggle button has the correct aria-label", async ({ page }) => {
    // In dark mode, the aria-label should say "Switch to light mode"
    // Use the visible toggle button (handle both desktop and mobile)
    const toggle = page.locator('button[aria-label="Switch to light mode"]').first();
    await expect(toggle).toBeVisible();
  });

  test("clicking toggle switches to light mode", async ({ page }) => {
    const toggle = page.locator('button[aria-label="Switch to light mode"]').first();
    await toggle.click();

    // After clicking, dark class should be removed
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Aria-label should update to "Switch to dark mode"
    const updatedToggle = page.locator('button[aria-label="Switch to dark mode"]').first();
    await expect(updatedToggle).toBeVisible();
  });

  test("clicking toggle twice returns to dark mode", async ({ page }) => {
    const toggle = page.locator('button[aria-label="Switch to light mode"]').first();

    // First click → light mode
    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Second click → back to dark mode
    const toggleBack = page.locator('button[aria-label="Switch to dark mode"]').first();
    await toggleBack.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("persists theme choice across page navigation", async ({ page }) => {
    // Switch to light mode
    const toggle = page.locator('button[aria-label="Switch to light mode"]').first();
    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Navigate to another page
    await page.goto("/about");
    await page.waitForLoadState("networkidle");

    // Theme should persist
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Navigate back to home
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Theme should still be light
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("hero text is readable in both themes", async ({ page }) => {
    // Check hero greeting is visible in dark mode (default)
    const greeting = page.locator("text=Hello, I'm").first();
    await expect(greeting).toBeVisible();

    // Switch to light mode
    const toggle = page.locator('button[aria-label="Switch to light mode"]').first();
    await toggle.click();

    // Check hero greeting is still visible in light mode
    await expect(greeting).toBeVisible();
  });
});
