import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/booking", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          json: { appointment: { id: "appt-1", name: "John Doe" } },
        });
      } else {
        await route.fulfill({ json: [] });
      }
    });
  });

  test.describe("SuccessModal booking (contact form → book consultation)", () => {
    test.beforeEach(async ({ page }) => {
      await page.route("**/api/contact", async (route) => {
        await route.fulfill({
          status: 200,
          json: { message: "Message sent successfully", id: "contact-1" },
        });
      });

      await page.goto("/contact");
      await page.waitForLoadState("networkidle");
    });

    function contactForm(page: import("@playwright/test").Page) {
      return page.locator('form').filter({ has: page.locator('textarea[placeholder*="Describe your project"]') });
    }

    function modal(page: import("@playwright/test").Page) {
      return page.locator('[class*="z-[60]"]').first();
    }

    async function fillAndSubmitContactForm(page: import("@playwright/test").Page) {
      const form = contactForm(page);
      await form.locator('input[placeholder="John Doe"]').fill("John Doe");
      await form.locator('input[placeholder="john@example.com"]').fill("john@example.com");
      await form.locator('input[placeholder="Acme Inc."]').fill("Acme Corp");
      await form.locator('input[placeholder="+1 (555) 000-0000"]').fill("+1 555-123-4567");
      await form.locator("select").first().selectOption("SaaS Platform");
      await form.locator('textarea[placeholder*="Describe your project"]').fill("I need a custom SaaS platform built with Next.js and PostgreSQL.");
      await form.getByRole("button", { name: /Send Message/ }).click();
    }

    test("shows success modal with Book a Free Consultation button after form submit", async ({ page }) => {
      await fillAndSubmitContactForm(page);
      await expect(page.getByText("Message Sent Successfully!")).toBeVisible();
      await expect(modal(page).getByRole("button", { name: /Book a Free Consultation/ })).toBeVisible();
    });

    test("booking form inside modal validates required date", async ({ page }) => {
      await fillAndSubmitContactForm(page);
      await modal(page).getByRole("button", { name: /Book a Free Consultation/ }).click();
      await expect(modal(page).locator('input[type="date"]')).toBeVisible();
      await expect(modal(page).getByRole("button", { name: /Book Now/ })).toBeDisabled();
    });

    test("fills date and submits booking successfully from modal", async ({ page }) => {
      await fillAndSubmitContactForm(page);
      await modal(page).getByRole("button", { name: /Book a Free Consultation/ }).click();
      const m = modal(page);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await m.locator('input[type="date"]').fill(tomorrow.toISOString().split("T")[0]);
      await m.locator('input[type="time"]').fill("10:00");
      await m.getByRole("button", { name: /Book Now/ }).click();
      await expect(page.getByText("Consultation Booked!")).toBeVisible();
    });

    test("can go back from booking step to success message", async ({ page }) => {
      await fillAndSubmitContactForm(page);
      await modal(page).getByRole("button", { name: /Book a Free Consultation/ }).click();
      await expect(modal(page).locator('input[type="date"]')).toBeVisible();
      await modal(page).getByRole("button", { name: /Back/ }).click();
      await expect(page.getByText("Message Sent Successfully!")).toBeVisible();
    });

    test("shows error when booking API fails", async ({ page }) => {
      await page.route("**/api/booking", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({ status: 400, json: { error: "Failed" } });
        } else {
          await route.fulfill({ json: [] });
        }
      });

      await fillAndSubmitContactForm(page);
      await modal(page).getByRole("button", { name: /Book a Free Consultation/ }).click();
      const m = modal(page);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await m.locator('input[type="date"]').fill(tomorrow.toISOString().split("T")[0]);
      await m.locator('input[type="time"]').fill("10:00");
      await m.getByRole("button", { name: /Book Now/ }).click();
      await expect(m.getByText("Something went wrong. Please try again.")).toBeVisible();
    });
  });

  test.describe("BookingSection inline form on /contact", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/contact");
      await page.waitForLoadState("networkidle");
    });

    test("renders the Book a Free Consultation section", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /Book a Free Consultation/ }).first()).toBeVisible();
    });

    test("shows booking form when Book Now button is clicked", async ({ page }) => {
      await page.locator('button:has-text("Book a Free Consultation")').last().click();
      const form = page.locator('form').filter({ has: page.getByPlaceholder("Briefly describe what you'd like to discuss...") });
      await expect(form.locator('input[placeholder="John Doe"]')).toBeVisible();
      await expect(form.locator('input[placeholder="john@example.com"]')).toBeVisible();
      await expect(form.locator('input[type="date"]')).toBeVisible();
    });

    test("validates required fields before submit", async ({ page }) => {
      await page.locator('button:has-text("Book a Free Consultation")').last().click();
      const form = page.locator('form').filter({ has: page.getByPlaceholder("Briefly describe what you'd like to discuss...") });
      await form.getByRole("button", { name: /Book Consultation/ }).click();
      await expect(page.getByText("Name is required")).toBeVisible();
      await expect(page.getByText("Email is required")).toBeVisible();
      await expect(page.getByText("Date is required")).toBeVisible();
    });

    test("submits booking form successfully", async ({ page }) => {
      await page.locator('button:has-text("Book a Free Consultation")').last().click();
      const form = page.locator('form').filter({ has: page.getByPlaceholder("Briefly describe what you'd like to discuss...") });
      await form.locator('input[placeholder="John Doe"]').fill("Jane Doe");
      await form.locator('input[placeholder="john@example.com"]').fill("jane@example.com");
      await form.locator('input[placeholder="+1 (555) 000-0000"]').fill("+1 555-123-4567");
      await form.locator('input[placeholder="Acme Inc."]').fill("Acme Corp");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await form.locator('input[type="date"]').fill(tomorrow.toISOString().split("T")[0]);
      await form.locator('input[type="time"]').fill("14:00");
      await form.getByPlaceholder("Briefly describe what you'd like to discuss...").fill("I want to discuss a new project.");
      await form.getByRole("button", { name: /Book Consultation/ }).click();
      await expect(page.getByText("Consultation Booked!")).toBeVisible();
    });

    test("shows error when booking API fails", async ({ page }) => {
      await page.route("**/api/booking", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({ status: 400, json: { error: "Failed" } });
        } else {
          await route.fulfill({ json: [] });
        }
      });

      await page.locator('button:has-text("Book a Free Consultation")').last().click();
      const form = page.locator('form').filter({ has: page.getByPlaceholder("Briefly describe what you'd like to discuss...") });
      await form.locator('input[placeholder="John Doe"]').fill("Jane Doe");
      await form.locator('input[placeholder="john@example.com"]').fill("jane@example.com");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await form.locator('input[type="date"]').fill(tomorrow.toISOString().split("T")[0]);
      await form.getByRole("button", { name: /Book Consultation/ }).click();
      await expect(page.getByText("Something went wrong. Please try again.")).toBeVisible();
    });

    test("cancel button hides the form", async ({ page }) => {
      await page.locator('button:has-text("Book a Free Consultation")').last().click();
      const form = page.locator('form').filter({ has: page.getByPlaceholder("Briefly describe what you'd like to discuss...") });
      await expect(form.locator('input[placeholder="John Doe"]')).toBeVisible();
      await form.getByRole("button", { name: /Cancel/ }).last().click();
      await expect(form.locator('input[placeholder="John Doe"]')).not.toBeVisible();
    });

    test("shows Google Calendar option", async ({ page }) => {
      await expect(page.getByText("Or use Google Calendar")).toBeVisible();
    });
  });
});
