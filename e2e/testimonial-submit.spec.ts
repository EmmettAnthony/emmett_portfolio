import { test, expect } from "@playwright/test";

test.describe("Testimonial Submission Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/testimonials/submit");
    await page.waitForLoadState("networkidle");
  });

  test("renders the page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Share Your Experience" })
    ).toBeVisible();
  });

  test("renders the description text", async ({ page }) => {
    await expect(
      page.getByText(/Your feedback helps us grow/)
    ).toBeVisible();
  });

  test("renders the About You section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "About You" })
    ).toBeVisible();
  });

  test("renders all form fields", async ({ page }) => {
    await expect(page.locator('input[placeholder="Your name *"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Your email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Company"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Position"]')).toBeVisible();
  });

  test("renders the photo upload button", async ({ page }) => {
    const uploadBtn = page.getByRole("button", { name: "Upload Photo" });
    await expect(uploadBtn).toBeVisible();
  });

  test("renders the Your Review section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Your Review" })
    ).toBeVisible();
  });

  test("renders star rating selector", async ({ page }) => {
    const stars = page.locator("button").filter({ has: page.locator("svg.lucide-star") });
    await expect(stars).toHaveCount(5);
  });

  test("renders the testimonial textarea", async ({ page }) => {
    await expect(
      page.locator('textarea[placeholder*="Tell us about your experience"]')
    ).toBeVisible();
  });

  test("renders character count", async ({ page }) => {
    await expect(page.getByText("0 / 1000")).toBeVisible();
  });

  test("shows rating label on star hover", async ({ page }) => {
    const stars = page.locator("button").filter({ has: page.locator("svg.lucide-star") });
    await stars.nth(3).hover();
    await expect(page.getByText("Great")).toBeVisible();
  });

  test("allows selecting a rating", async ({ page }) => {
    const stars = page.locator("button").filter({ has: page.locator("svg.lucide-star") });
    await stars.nth(2).click();
    await stars.nth(2).hover();
    await expect(page.getByText("Good")).toBeVisible();
  });

  test("submit button is disabled when name or content is empty", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: "Submit Testimonial" });
    await expect(submitBtn).toBeDisabled();
  });

  test("submit button enables when required fields are filled", async ({ page }) => {
    await page.locator('input[placeholder="Your name *"]').fill("Jane Doe");
    await page
      .locator('textarea[placeholder*="Tell us about your experience"]')
      .fill("Amazing work! Highly recommend.");
    const submitBtn = page.getByRole("button", { name: "Submit Testimonial" });
    await expect(submitBtn).toBeEnabled();
  });

  test("shows success state after submitting", async ({ page }) => {
    await page.route("**/api/testimonials/submit", async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.locator('input[placeholder="Your name *"]').fill("Jane Doe");
    await page.locator('input[placeholder="Your email"]').fill("jane@example.com");
    await page.locator('input[placeholder="Company"]').fill("Acme Corp");
    await page.locator('input[placeholder="Position"]').fill("CEO");
    await page
      .locator('textarea[placeholder*="Tell us about your experience"]')
      .fill("Working with Emmett was an absolute pleasure. The website exceeded our expectations and the communication throughout the project was excellent.");
    await page.getByRole("button", { name: "Submit Testimonial" }).click();

    await expect(page.getByRole("heading", { name: "Thank You!" })).toBeVisible();
    await expect(
      page.getByText(/Your testimonial has been submitted/)
    ).toBeVisible();
  });

  test("shows Submit Another and View All links after submission", async ({ page }) => {
    await page.route("**/api/testimonials/submit", async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.locator('input[placeholder="Your name *"]').fill("Jane Doe");
    await page
      .locator('textarea[placeholder*="Tell us about your experience"]')
      .fill("Great experience working with the team. Very professional and responsive.");
    await page.getByRole("button", { name: "Submit Testimonial" }).click();

    await expect(page.getByRole("link", { name: "Submit Another" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View All Testimonials" })).toBeVisible();
  });

  test("shows error message when API fails", async ({ page }) => {
    await page.route("**/api/testimonials/submit", async (route) => {
      await route.fulfill({
        status: 400,
        json: { error: "Testimonial already exists for this email" },
      });
    });

    await page.locator('input[placeholder="Your name *"]').fill("Jane Doe");
    await page
      .locator('textarea[placeholder*="Tell us about your experience"]')
      .fill("Great experience working with the team.");
    await page.getByRole("button", { name: "Submit Testimonial" }).click();

    await expect(
      page.getByText("Testimonial already exists for this email")
    ).toBeVisible();
  });

  test("updates character count as user types", async ({ page }) => {
    await page
      .locator('textarea[placeholder*="Tell us about your experience"]')
      .fill("Hello");
    await expect(page.getByText("5 / 1000")).toBeVisible();
  });

  test("shows character count warning near limit", async ({ page }) => {
    await page
      .locator('textarea[placeholder*="Tell us about your experience"]')
      .fill("A".repeat(950));
    await expect(page.getByText("950 / 1000")).toBeVisible();
  });
});
