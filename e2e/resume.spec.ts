import { test, expect } from "@playwright/test";

test.describe("Resume Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume");
  });

  test("renders the name and title", async ({ page }) => {
    await expect(page.locator("text=Emmett Anthony").first()).toBeVisible();
    await expect(page.locator("text=Professional Software Developer").first()).toBeVisible();
  });

  test("renders location and email", async ({ page }) => {
    await expect(page.locator("text=San Francisco, CA").first()).toBeVisible();
    await expect(page.locator("text=hello@emmettanthony.dev").first()).toBeVisible();
  });

  test("renders the Download CV button", async ({ page }) => {
    const downloadBtn = page.locator("text=Download CV");
    await expect(downloadBtn).toBeVisible();
  });

  test("renders the Professional Summary section", async ({ page }) => {
    await expect(page.locator("text=Professional Summary").first()).toBeVisible();
    const summary = page.locator("text=Professional Software Developer with 3+ years");
    await expect(summary).toBeVisible();
  });

  test("renders Work Experience section", async ({ page }) => {
    await expect(page.locator("text=Work Experience").first()).toBeVisible();
  });

  test("renders experience items with company names", async ({ page }) => {
    const companies = ["TechFlow Solutions", "WebCraft Agency", "StartUp Labs"];
    for (const company of companies) {
      await expect(page.locator(`text=${company}`).first()).toBeVisible();
    }
  });

  test("renders experience positions", async ({ page }) => {
    const positions = ["Senior Software Developer", "Full Stack Developer", "Junior Developer"];
    for (const position of positions) {
      await expect(page.locator(`text=${position}`).first()).toBeVisible();
    }
  });

  test("renders Technical Skills section with categories", async ({ page }) => {
    await expect(page.locator("text=Technical Skills").first()).toBeVisible();
    const skillCategories = ["Frontend", "Backend", "Database", "CMS", "Tools"];
    for (const cat of skillCategories) {
      await expect(page.locator(`text=${cat}`).first()).toBeVisible();
    }
  });

  test("renders Education section", async ({ page }) => {
    await expect(page.locator("text=Education").first()).toBeVisible();
    const degree = page.locator("text=Bachelor of Science in Computer Science");
    await expect(degree).toBeVisible();
  });

  test("renders education institution and GPA", async ({ page }) => {
    await expect(page.locator("text=University of California, Berkeley").first()).toBeVisible();
    await expect(page.locator("text=GPA: 3.7").first()).toBeVisible();
  });

  test("renders Certifications section with certification names", async ({ page }) => {
    await expect(page.locator("text=Certifications").first()).toBeVisible();
    const certs = ["AWS Certified Developer", "Meta Front-End Developer", "Google Professional Cloud Developer"];
    for (const cert of certs) {
      await expect(page.locator(`text=${cert}`).first()).toBeVisible();
    }
  });

  test("certification links open in new tab", async ({ page }) => {
    const certLinks = page.locator('a[target="_blank"][rel="noopener noreferrer"]');
    const certLink = certLinks.filter({ hasText: "AWS" }).first();
    await expect(certLink).toBeVisible();
    await expect(certLink).toHaveAttribute("href", /amazon/);
  });
});
