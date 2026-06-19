import { test, expect } from "@playwright/test";

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
  });

  test("renders the Get in Touch heading", async ({ page }) => {
    const heading = page.locator("text=Get in Touch");
    await expect(heading).toBeVisible();
  });

  test("renders the description text", async ({ page }) => {
    const desc = page.locator("text=Have a project in mind or just want to say hi");
    await expect(desc).toBeVisible();
  });

  test("renders contact info cards", async ({ page }) => {
    const labels = ["Email", "Location", "GitHub", "LinkedIn"];
    for (const label of labels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
  });

  test("renders contact info values", async ({ page }) => {
    await expect(page.locator("text=hello@emmettanthony.dev").first()).toBeVisible();
    await expect(page.locator("text=San Francisco, CA").first()).toBeVisible();
  });

  test("email card links to mailto:", async ({ page }) => {
    const emailCard = page.locator('a[href^="mailto:"]').first();
    await expect(emailCard).toBeVisible();
  });

  test("GitHub card links to github.com", async ({ page }) => {
    const githubCard = page.locator('a[href*="github.com"]').first();
    await expect(githubCard).toBeVisible();
  });

  test("renders the contact form with all fields", async ({ page }) => {
    const fields = ["name", "email", "phone", "company", "subject", "message"];
    for (const field of fields) {
      const input = page.locator(`#${field}`);
      await expect(input).toBeVisible();
    }
  });

  test("renders required field labels with asterisks", async ({ page }) => {
    const nameLabel = page.locator('label[for="name"]');
    await expect(nameLabel).toContainText("*");
  });

  test("form shows validation errors on empty submit", async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(page.locator("text=Name is required")).toBeVisible();
    await expect(page.locator("text=Email is required")).toBeVisible();
    await expect(page.locator("text=Subject is required")).toBeVisible();
    await expect(page.locator("text=Message is required")).toBeVisible();
  });

  test("form validates email with required check", async ({ page }) => {
    await page.waitForSelector("#name");
    // Fill all required fields except email (leave email empty)
    await page.locator("#name").fill("John Doe");
    await page.locator("#subject").fill("Test Subject");
    await page.locator("#message").fill("This is a test message with enough characters");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Email is required").first()).toBeVisible();
  });

  test("form validates minimum message length", async ({ page }) => {
    await page.waitForSelector("#name");
    await page.locator("#name").fill("John Doe");
    await page.locator("#email").fill("john@example.com");
    await page.locator("#subject").fill("Test Subject");
    await page.locator("#message").fill("Short");

    await page.locator('button[type="submit"]').click();

    await expect(page.locator("text=Message must be at least 10 characters").first()).toBeVisible();
  });

  test("renders the Send Message button", async ({ page }) => {
    const sendBtn = page.locator("text=Send Message");
    await expect(sendBtn).toBeVisible();
  });
});
