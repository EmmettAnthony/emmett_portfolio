import { test, expect } from "@playwright/test";

const MOCK_MEETING_TYPES = [
  {
    id: "mt-1",
    name: "Free Consultation",
    slug: "free-consultation",
    description: "A quick 30-minute chat to discuss your project needs.",
    duration: 30,
    color: "#3b82f6",
    icon: null,
    location: null,
    link: null,
    price: null,
  },
  {
    id: "mt-2",
    name: "Project Discussion",
    slug: "project-discussion",
    description: "A deeper dive into your project requirements and scope.",
    duration: 60,
    color: "#10b981",
    icon: null,
    location: "Virtual",
    link: null,
    price: 150,
  },
];

const MOCK_AVAILABILITY = [
  { id: "avail-1", dayOfWeek: 1, isActive: true, startTime: "09:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00", slotDuration: 30 },
  { id: "avail-2", dayOfWeek: 2, isActive: true, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, slotDuration: 30 },
  { id: "avail-3", dayOfWeek: 3, isActive: true, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, slotDuration: 30 },
  { id: "avail-4", dayOfWeek: 4, isActive: true, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, slotDuration: 30 },
  { id: "avail-5", dayOfWeek: 5, isActive: true, startTime: "09:00", endTime: "15:00", breakStart: null, breakEnd: null, slotDuration: 30 },
  { id: "avail-6", dayOfWeek: 6, isActive: false, startTime: "10:00", endTime: "14:00", breakStart: null, breakEnd: null, slotDuration: 30 },
  { id: "avail-0", dayOfWeek: 0, isActive: false, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, slotDuration: 30 },
];

const MOCK_BOOKING_CONFIG = {
  meetingTypes: MOCK_MEETING_TYPES,
  availability: MOCK_AVAILABILITY,
  dateExceptions: [],
};

// Helper: locate the Next/Confirm button in the navigation footer
function nextButton(page: import("@playwright/test").Page) {
  // Scope to the navigation footer area (the last flex row before the summary)
  return page.locator("button:has-text('Next'), button:has-text('Confirm Booking'), button:has-text('Booking...')").last();
}

function backButton(page: import("@playwright/test").Page) {
  return page.locator("button:has-text('Back')");
}

function dateGrid(page: import("@playwright/test").Page) {
  return page.locator("text=Available Dates").locator("..").locator("..");
}

function timeSlotGrid(page: import("@playwright/test").Page) {
  // One level up: the div containing the label and the time slot buttons
  return page.locator("text=Available Times").locator("..");
}

test.describe("Book Consultation Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/public/booking-config", async (route) => {
      await route.fulfill({ json: MOCK_BOOKING_CONFIG });
    });
    await page.route("**/api/calendar/appointments", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          json: {
            appointment: { id: "appt-1", name: "Jane Doe", email: "jane@example.com" },
          },
        });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.goto("/book-consultation");
    await page.waitForLoadState("networkidle");
  });

  // ─── Page Rendering ──────────────────────────────────────────────────────

  test("renders the page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Book a Consultation" })).toBeVisible();
  });

  test("renders step progress indicators", async ({ page }) => {
    // Step numbers 1, 2, 3 should be visible in the progress bar
    await expect(page.getByText("1").first()).toBeVisible();
    await expect(page.getByText("2").first()).toBeVisible();
    await expect(page.getByText("3").first()).toBeVisible();
  });

  test("renders meeting type cards with details", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Select Meeting Type" })).toBeVisible();
    await expect(page.getByText("Free Consultation").first()).toBeVisible();
    await expect(page.getByText("Project Discussion").first()).toBeVisible();
    await expect(page.getByText("30 min")).toBeVisible();
    await expect(page.getByText("60 min")).toBeVisible();
    await expect(page.getByText("$150")).toBeVisible();
    await expect(page.getByText("Virtual").first()).toBeVisible();
  });

  test("renders the summary section with placeholder", async ({ page }) => {
    await expect(page.getByText("Summary")).toBeVisible();
    const summary = page.getByText("Summary").locator("..");
    await expect(summary.getByText("Not selected")).toBeVisible();
  });

  // ─── Step 1: Meeting Type Selection ──────────────────────────────────────

  test("selecting a meeting type highlights it and enables Next", async ({ page }) => {
    const card = page.locator("button").filter({ has: page.locator("h3:has-text('Free Consultation')") });
    await card.click();
    await expect(card).toHaveClass(/border-blue-500/);
    await expect(nextButton(page)).toBeEnabled();
  });

  test("navigates forward to step 2 and back to step 1", async ({ page }) => {
    await page.locator("button").filter({ has: page.locator("h3:has-text('Free Consultation')") }).click();
    await nextButton(page).click();
    await expect(page.getByRole("heading", { name: "Select Date & Time" })).toBeVisible();
    await expect(page.getByText("Available Dates")).toBeVisible();

    // Go back
    await backButton(page).click();
    await expect(page.getByRole("heading", { name: "Select Meeting Type" })).toBeVisible();
  });

  test("shows available dates after advancing to step 2", async ({ page }) => {
    await page.locator("button").filter({ has: page.locator("h3:has-text('Free Consultation')") }).click();
    await nextButton(page).click();
    await expect(page.getByText("Available Dates")).toBeVisible();

    // Date buttons should exist
    await expect(dateGrid(page).locator("button").first()).toBeVisible();
  });

  // ─── Step 2: Date & Time Selection ───────────────────────────────────────

  async function goToStep2(page: import("@playwright/test").Page) {
    await page.locator("button").filter({ has: page.locator("h3:has-text('Free Consultation')") }).click();
    await nextButton(page).click();
    await expect(page.getByText("Available Dates")).toBeVisible();
  }

  test("selecting a date reveals time slots", async ({ page }) => {
    await goToStep2(page);
    await dateGrid(page).locator("button").first().click();
    await expect(page.getByText("Available Times")).toBeVisible();
  });

  test("selecting a time slot enables the Next button", async ({ page }) => {
    await goToStep2(page);
    await dateGrid(page).locator("button").first().click();
    await expect(page.getByText("Available Times")).toBeVisible();
    const firstTime = timeSlotGrid(page).locator("button").first();
    await firstTime.click();
    await expect(firstTime).toHaveClass(/border-blue-500/);
    await expect(nextButton(page)).toBeEnabled();
  });

  test("navigates forward to step 3", async ({ page }) => {
    await goToStep2(page);
    await dateGrid(page).locator("button").first().click();
    await expect(page.getByText("Available Times")).toBeVisible();
    await timeSlotGrid(page).locator("button").first().click();
    await nextButton(page).click();
    await expect(page.getByRole("heading", { name: "Your Details" })).toBeVisible();
    await expect(page.getByText("Name *")).toBeVisible();
    await expect(page.getByText("Email *")).toBeVisible();
  });

  // ─── Step 3: Form Details & Submission ───────────────────────────────────

  async function goToStep3(page: import("@playwright/test").Page) {
    await goToStep2(page);
    await dateGrid(page).locator("button").first().click();
    await expect(page.getByText("Available Times")).toBeVisible();
    await timeSlotGrid(page).locator("button").first().click();
    await nextButton(page).click();
    await expect(page.getByRole("heading", { name: "Your Details" })).toBeVisible();
  }

  test("Confirm Booking button is disabled until form is filled", async ({ page }) => {
    await goToStep3(page);
    await expect(page.getByRole("button", { name: "Confirm Booking" })).toBeDisabled();
  });

  test("fills in details and submits the booking successfully", async ({ page }) => {
    await goToStep3(page);
    await page.getByPlaceholder("Your name").fill("Jane Doe");
    await page.getByPlaceholder("your@email.com").fill("jane@example.com");
    await page.getByPlaceholder("+1 (555) 000-0000").fill("+1 555-123-4567");
    await page.getByPlaceholder("Company name").fill("Acme Corp");
    await page.getByPlaceholder("Tell me about your project...").fill("I need a new website.");
    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await expect(page.getByRole("heading", { name: "Booking Confirmed!" })).toBeVisible();
    await expect(page.getByText("Jane Doe")).toBeVisible();
    await expect(page.getByText("jane@example.com")).toBeVisible();
    await expect(page.getByText("30 minutes")).toBeVisible();
  });

  test("shows error message when booking API fails", async ({ page }) => {
    await goToStep3(page);

    // Override the appointments mock (LIFO = last route wins)
    await page.route("**/api/calendar/appointments", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 400, json: { error: "No available time slots on this date" } });
      } else {
        await route.fulfill({ json: [] });
      }
    });

    await page.getByPlaceholder("Your name").fill("Jane Doe");
    await page.getByPlaceholder("your@email.com").fill("jane@example.com");
    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await expect(page.getByText("No available time slots on this date")).toBeVisible();
  });

  test("can go back to step 2 from step 3", async ({ page }) => {
    await goToStep3(page);
    await backButton(page).click();
    await expect(page.getByRole("heading", { name: "Select Date & Time" })).toBeVisible();
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────────

  test("shows empty state when no meeting types exist", async ({ page }) => {
    await page.route("**/api/public/booking-config", async (route) => {
      await route.fulfill({ json: { meetingTypes: [], availability: [], dateExceptions: [] } });
    });
    await page.goto("/book-consultation");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("No meeting types available")).toBeVisible();
  });

  test("shows no dates when all days are inactive", async ({ page }) => {
    await page.route("**/api/public/booking-config", async (route) => {
      await route.fulfill({
        json: {
          meetingTypes: MOCK_MEETING_TYPES,
          availability: [
            { id: "avail-0", dayOfWeek: 0, isActive: false, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null, slotDuration: 30 },
            { id: "avail-6", dayOfWeek: 6, isActive: false, startTime: "10:00", endTime: "14:00", breakStart: null, breakEnd: null, slotDuration: 30 },
          ],
          dateExceptions: [],
        },
      });
    });
    await page.goto("/book-consultation");
    await page.waitForLoadState("networkidle");
    await page.locator("button").filter({ has: page.locator("h3:has-text('Free Consultation')") }).click();
    await nextButton(page).click();
    await expect(page.getByText("Available Dates")).toBeVisible();
    await expect(dateGrid(page).locator("button")).toHaveCount(0);
  });
});
