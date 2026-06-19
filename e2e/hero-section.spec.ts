import { test, expect } from "@playwright/test";

test.describe("Hero Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the greeting text", async ({ page }) => {
    const greeting = page.locator("text=Hello, I'm").first();
    await expect(greeting).toBeVisible();
  });

  test("renders the full name", async ({ page }) => {
    const name = page.locator("text=Emmett Anthony").first();
    await expect(name).toBeVisible();
  });

  test("renders the site description", async ({ page }) => {
    const desc = page.locator("text=Emmett Anthony is a software developer").first();
    await expect(desc).toBeVisible();
  });

  test("renders the Hire Me button linking to /contact", async ({ page }) => {
    // Scope to hero section specifically to avoid matching navbar link
    const hireBtn = page.locator("section a[href='/contact']").first();
    await expect(hireBtn).toBeVisible();
    await expect(hireBtn).toContainText("Hire Me");
  });

  test("renders the View Projects button linking to /portfolio", async ({ page }) => {
    const projectsBtn = page.locator("section a[href='/portfolio']").first();
    await expect(projectsBtn).toBeVisible();
    await expect(projectsBtn).toContainText("View Projects");
  });

  test("renders social links with correct aria labels and attributes", async ({ page }) => {
    const github = page.locator('section a[aria-label="GitHub"]').first();
    const linkedin = page.locator('section a[aria-label="LinkedIn"]').first();
    const twitter = page.locator('section a[aria-label="Twitter"]').first();

    await expect(github).toBeVisible();
    await expect(linkedin).toBeVisible();
    await expect(twitter).toBeVisible();

    // Verify they open in a new tab with security attributes
    await expect(github).toHaveAttribute("target", "_blank");
    await expect(github).toHaveAttribute("rel", "noopener noreferrer");
    await expect(linkedin).toHaveAttribute("target", "_blank");
    await expect(twitter).toHaveAttribute("target", "_blank");
  });

  test("renders the typewriter area with initial text", async ({ page }) => {
    // The typewriter starts with "Full Stack Developer" visible immediately on mount
    const typewriterText = page.locator("text=Full Stack Developer").first();
    await expect(typewriterText).toBeVisible();
  });

  test("renders the blinking cursor", async ({ page }) => {
    const cursor = page.locator(".animate-pulse").first();
    await expect(cursor).toBeVisible();
  });

  test("renders Connect label in the hero social section", async ({ page }) => {
    const connectLabel = page.locator("section").locator("text=Connect").first();
    await expect(connectLabel).toBeVisible();
  });

  test("renders the scroll indicator", async ({ page }) => {
    const scrollText = page.locator("text=Scroll").first();
    await expect(scrollText).toBeVisible();
  });

  test("renders the profile avatar with correct alt text", async ({ page }) => {
    const avatar = page.locator('img[alt="Emmett Anthony"]');
    await expect(avatar).toBeVisible();
  });

  test("renders the code window with portfolio.tsx label", async ({ page }) => {
    const codeLabel = page.locator("text=portfolio.tsx").first();
    await expect(codeLabel).toBeVisible();
  });

  test("renders the 'Available for work' badge", async ({ page }) => {
    const badge = page.locator("text=Available for work").first();
    await expect(badge).toBeVisible();
  });
});
