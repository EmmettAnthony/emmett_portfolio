import { test, expect } from "@playwright/test";

test.describe("Service Inquiry Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/services/web-development");
    await page.waitForLoadState("networkidle");
  });

  test("renders the inquiry form heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Get a Quote" })).toBeVisible();
  });

  test("renders the description text", async ({ page }) => {
    await expect(page.getByText(/Tell me about your project/)).toBeVisible();
  });

  test("renders all form fields", async ({ page }) => {
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();
    await expect(page.locator('input[placeholder="john@example.com"]')).toBeVisible();
    await expect(page.locator('input[placeholder="+1 (555) 000-0000"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Company Inc."]')).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
    await expect(
      page.locator('textarea[placeholder*="Describe your project"]')
    ).toBeVisible();
  });

  test("renders required field indicators", async ({ page }) => {
    const fullNameLabel = page.locator("text=Full Name").first();
    await expect(fullNameLabel).toContainText("*");
    const emailLabel = page.locator("text=Email").first();
    await expect(emailLabel).toContainText("*");
    const projectDetailsLabel = page.locator("text=Project Details").first();
    await expect(projectDetailsLabel).toContainText("*");
  });

  test("renders the Send Inquiry button", async ({ page }) => {
    const sendBtn = page.getByRole("button", { name: "Send Inquiry" });
    await expect(sendBtn).toBeVisible();
  });

  test("renders budget range options", async ({ page }) => {
    const select = page.locator("select");
    await expect(select.locator("option[value='']")).toHaveText("Select a range");
    await expect(select.locator("option[value='under-1000']")).toHaveText("Under $1,000");
    await expect(select.locator("option[value='1000-5000']")).toHaveText("$1,000 - $5,000");
    await expect(select.locator("option[value='5000-10000']")).toHaveText("$5,000 - $10,000");
    await expect(select.locator("option[value='10000-25000']")).toHaveText("$10,000 - $25,000");
    await expect(select.locator("option[value='25000+']")).toHaveText("$25,000+");
    await expect(select.locator("option[value='not-sure']")).toHaveText("Not Sure");
  });

  test("shows phone and WhatsApp contact options", async ({ page }) => {
    await expect(page.locator('a[href^="tel:"]')).toBeVisible();
    await expect(page.locator('a[href^="https://wa.me/"]')).toBeVisible();
  });

  test("submits inquiry successfully with valid data", async ({ page }) => {
    await page.route("**/api/services/inquiry", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      expect(body.fullName).toBe("John Doe");
      expect(body.email).toBe("john@example.com");
      expect(body.message).toBe("I need a new website built with Next.js");
      expect(body.serviceName).toBe("Web Development");
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.locator('input[placeholder="John Doe"]').fill("John Doe");
    await page.locator('input[placeholder="john@example.com"]').fill("john@example.com");
    await page.locator('input[placeholder="+1 (555) 000-0000"]').fill("+1 555-123-4567");
    await page.locator('input[placeholder="Company Inc."]').fill("Acme Corp");
    await page.locator("select").selectOption("5000-10000");
    await page
      .locator('textarea[placeholder*="Describe your project"]')
      .fill("I need a new website built with Next.js");
    await page.getByRole("button", { name: "Send Inquiry" }).click();

    await expect(page.getByText("Thank You!")).toBeVisible();
    await expect(
      page.getByText(/Your inquiry has been received/)
    ).toBeVisible();
  });

  test("submits inquiry without optional fields", async ({ page }) => {
    await page.route("**/api/services/inquiry", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      expect(body.phone).toBe("");
      expect(body.company).toBe("");
      expect(body.budget).toBe("");
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.locator('input[placeholder="John Doe"]').fill("John Doe");
    await page.locator('input[placeholder="john@example.com"]').fill("john@example.com");
    await page
      .locator('textarea[placeholder*="Describe your project"]')
      .fill("I need a new website built with Next.js");
    await page.getByRole("button", { name: "Send Inquiry" }).click();

    await expect(page.getByText("Thank You!")).toBeVisible();
  });

  test("handles API failure gracefully", async ({ page }) => {
    await page.route("**/api/services/inquiry", async (route) => {
      await route.fulfill({ status: 500, json: { error: "Server error" } });
    });

    await page.locator('input[placeholder="John Doe"]').fill("John Doe");
    await page.locator('input[placeholder="john@example.com"]').fill("john@example.com");
    await page
      .locator('textarea[placeholder*="Describe your project"]')
      .fill("I need a new website built with Next.js");
    const btn = page.getByRole("button", { name: "Send Inquiry" });
    await btn.click();
    // Button should become enabled again after error response
    await expect(btn).toBeEnabled({ timeout: 5000 });
  });

  test("does not submit when required fields are empty", async ({ page }) => {
    let requestMade = false;
    await page.route("**/api/services/inquiry", async (route) => {
      requestMade = true;
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.getByRole("button", { name: "Send Inquiry" }).click();
    expect(requestMade).toBe(false);
  });
});
