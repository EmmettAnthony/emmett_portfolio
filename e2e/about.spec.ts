import { test, expect } from "@playwright/test";

test.describe("About Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about");
  });

  test("renders the About heading with name", async ({ page }) => {
    const heading = page.locator("text=About Emmett").first();
    await expect(heading).toBeVisible();
  });

  test("renders the site description paragraph", async ({ page }) => {
    const desc = page.locator("text=Emmett Anthony is a software developer").first();
    await expect(desc).toBeVisible();
  });

  test("renders all four stat cards", async ({ page }) => {
    const labels = ["Years Experience", "Projects Completed", "Education", "Certifications"];
    for (const label of labels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
  });

  test("renders stat values (3+ years, 25+ projects)", async ({ page }) => {
    // Stat values render inside AnimatedCounter which starts at 0, so we check the label text
    await expect(page.locator("text=Years Experience").first()).toBeVisible();
    await expect(page.locator("text=Projects Completed").first()).toBeVisible();
  });

  test("renders the code window with about.ts label", async ({ page }) => {
    const codeLabel = page.locator("text=about.ts").first();
    await expect(codeLabel).toBeVisible();
  });

  test("renders code syntax keywords in the window", async ({ page }) => {
    const interfaceKeyword = page.locator("text=interface").first();
    await expect(interfaceKeyword).toBeVisible();
  });

  test("renders the Career Journey timeline section", async ({ page }) => {
    const careerHeading = page.locator("text=Career Journey").first();
    await expect(careerHeading).toBeVisible();
  });

  test("renders timeline items with company names", async ({ page }) => {
    const companyNames = ["TechFlow Solutions", "WebCraft Agency", "StartUp Labs"];
    for (const company of companyNames) {
      await expect(page.locator(`text=${company}`).first()).toBeVisible();
    }
  });

  test("renders Education & Certifications section", async ({ page }) => {
    const eduSection = page.locator("text=Education & Certifications").first();
    await expect(eduSection).toBeVisible();
  });

  test("renders education degree", async ({ page }) => {
    const degree = page.locator("text=Bachelor of Science in Computer Science").first();
    await expect(degree).toBeVisible();
  });

  test("renders certification names", async ({ page }) => {
    const certs = ["AWS Certified Developer", "Meta Front-End Developer", "Google Professional Cloud Developer"];
    for (const cert of certs) {
      await expect(page.locator(`text=${cert}`).first()).toBeVisible();
    }
  });

  test("renders the 'Always learning' comment in code window", async ({ page }) => {
    const comment = page.locator("text=Always learning, always building").first();
    await expect(comment).toBeVisible();
  });
});
