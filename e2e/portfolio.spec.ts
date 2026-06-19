import { test, expect } from "@playwright/test";

test.describe("Portfolio Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portfolio");
  });

  test("renders the Portfolio section header", async ({ page }) => {
    const title = page.locator("text=Portfolio").first();
    await expect(title).toBeVisible();
  });

  test("renders the subtitle text", async ({ page }) => {
    const subtitle = page.locator("text=Explore my projects").first();
    await expect(subtitle).toBeVisible();
  });

  test("renders category filter buttons", async ({ page }) => {
    const categories = ["All", "Web Development", "Business Applications"];
    for (const cat of categories) {
      await expect(page.locator(`button:has-text("${cat}")`).first()).toBeVisible();
    }
  });

  test("renders the search input", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search projects..."]');
    await expect(searchInput).toBeVisible();
  });

  test("renders project cards with expected titles", async ({ page }) => {
    const titles = ["ShopFlow E-Commerce Platform", "TaskPro Project Management", "ContentCMS"];
    for (const title of titles) {
      await expect(page.locator(`text=${title}`).first()).toBeVisible();
    }
  });

  test("renders project tags", async ({ page }) => {
    const tags = ["Next.js", "TypeScript", "Stripe"];
    for (const tag of tags) {
      await expect(page.locator(`text=${tag}`).first()).toBeVisible();
    }
  });

  test("searching filters projects", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search projects..."]');
    await searchInput.fill("ShopFlow");

    // ShopFlow should still be visible
    await expect(page.locator("text=ShopFlow E-Commerce Platform").first()).toBeVisible();
  });

  test("searching for non-existent project shows empty state", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search projects..."]');
    await searchInput.fill("xyznonexistent");

    const emptyMsg = page.locator("text=No projects found matching your search.");
    await expect(emptyMsg).toBeVisible();
  });

  test("clicking category filter highlights the active one", async ({ page }) => {
    const cmsBtn = page.locator('button:has-text("CMS Solutions")').first();
    await cmsBtn.click();

    // Only CMS project should show - ContentCMS, not ShopFlow
    await expect(page.locator("text=ContentCMS").first()).toBeVisible();
  });

  test("renders project GitHub links", async ({ page }) => {
    // ShopFlow has a GitHub link
    const githubLink = page.locator('a[href*="github.com"]').first();
    await expect(githubLink).toBeVisible();
  });
});
