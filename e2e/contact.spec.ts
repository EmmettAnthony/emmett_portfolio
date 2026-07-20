import { test, expect } from "@playwright/test";

test.describe("Contact Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
  });

  test("renders the Let's Work Together heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Let's Work Together/i })
    ).toBeVisible();
  });

  test("renders the description text", async ({ page }) => {
    await expect(
      page.getByText(/Have a project in mind or just want to say hi/)
    ).toBeVisible();
  });

  test("renders contact info in the sidebar", async ({ page }) => {
    await expect(page.getByText("Location", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Email", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Phone", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Response Time", { exact: true })).toBeVisible();
    await expect(page.getByText("Availability", { exact: true })).toBeVisible();
  });

  test("renders contact info values in the sidebar", async ({ page }) => {
    await expect(page.getByText("emmettanthony998@gmail.com").first()).toBeVisible();
    await expect(page.getByText("Congo Town, Monrovia Liberia").first()).toBeVisible();
  });

  test("email link points to mailto:", async ({ page }) => {
    const emailLink = page.locator('a[href^="mailto:"]').first();
    await expect(emailLink).toBeVisible();
  });

  test("renders social links", async ({ page }) => {
    const socialLabels = ["GitHub", "LinkedIn", "Twitter"];
    for (const label of socialLabels) {
      await expect(page.locator(`a[aria-label="${label}"]`).first()).toBeVisible();
    }
  });

  test("renders the contact form with all fields", async ({ page }) => {
    const placeholders = [
      "John Doe",
      "john@example.com",
      "Acme Inc.",
      "+1 (555) 000-0000",
    ];
    for (const placeholder of placeholders) {
      await expect(
        page.locator(`input[placeholder="${placeholder}"]`)
      ).toBeVisible();
    }
    await expect(
      page.locator('textarea[placeholder*="Describe your project"]')
    ).toBeVisible();
    await expect(
      page.locator("select").first()
    ).toBeVisible();
  });

  test("renders required field labels with asterisks", async ({ page }) => {
    const labels = ["Full Name", "Email Address", "Project Type", "Project Details"];
    for (const label of labels) {
      const labelEl = page.locator("label").filter({ hasText: label });
      await expect(labelEl).toBeVisible();
      await expect(labelEl.locator("span.text-red-500")).toHaveText("*");
    }
  });

  test("form shows validation errors on empty submit", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: /Send Message/ });
    await submitBtn.click();

    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(
      page.getByText("Please provide at least 20 characters describing your project")
    ).toBeVisible();
  });

  test("form validates email field", async ({ page }) => {
    await page.locator('input[placeholder="John Doe"]').fill("John Doe");
    await page.locator('select').first().selectOption("Business Website");
    await page
      .locator('textarea[placeholder*="Describe your project"]')
      .fill("This is a test message with enough characters to pass validation");

    await page.getByRole("button", { name: /Send Message/ }).click();

    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  });

  test("form validates minimum project details length", async ({ page }) => {
    await page.locator('input[placeholder="John Doe"]').fill("John Doe");
    await page.locator('input[placeholder="john@example.com"]').fill("john@example.com");
    await page.locator('select').first().selectOption("Business Website");
    await page
      .locator('textarea[placeholder*="Describe your project"]')
      .fill("Short");

    await page.getByRole("button", { name: /Send Message/ }).click();

    await expect(
      page.getByText("Please provide at least 20 characters describing your project")
    ).toBeVisible();
  });

  test("renders the Send Message button", async ({ page }) => {
    const sendBtn = page.getByRole("button", { name: /Send Message/ });
    await expect(sendBtn).toBeVisible();
  });

  test("submits the form successfully with valid data", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.locator('input[placeholder="John Doe"]').fill("John Doe");
    await page.locator('input[placeholder="john@example.com"]').fill("john@example.com");
    await page.locator('input[placeholder="Acme Inc."]').fill("Acme Corp");
    await page.locator('input[placeholder="+1 (555) 000-0000"]').fill("+1 555-123-4567");
    await page.locator('select').first()      .selectOption("SaaS Platform");
    await page
      .locator('textarea[placeholder*="Describe your project"]')
      .fill("I need a custom web application built with Next.js and PostgreSQL.");

    await page.getByRole("button", { name: /Send Message/ }).click();

    await expect(page.getByText("Message Sent!")).toBeVisible();
  });
});
