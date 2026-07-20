import { describe, it, expect } from "vitest";

describe("PREBUILT_TEMPLATES", () => {
  it("exports PREBUILT_TEMPLATES with expected templates", async () => {
    const { PREBUILT_TEMPLATES } = await import("../email/templates/prebuilt");
    expect(PREBUILT_TEMPLATES).toHaveLength(18);

    const names = PREBUILT_TEMPLATES.map((t) => t.name);
    expect(names).toContain("Welcome Email");
    expect(names).toContain("Contact Confirmation");
    expect(names).toContain("Booking Confirmation");
    expect(names).toContain("Meeting Reminder");
    expect(names).toContain("Invoice");
    expect(names).toContain("Payment Receipt");
    expect(names).toContain("Payment Confirmation");
    expect(names).toContain("Password Reset");
    expect(names).toContain("Email Verification");
    expect(names).toContain("Magic Link");
    expect(names).toContain("Newsletter Template");
    expect(names).toContain("Project Kickoff");
    expect(names).toContain("Project Complete");
    expect(names).toContain("Review Request");
    expect(names).toContain("Admin Notification");
    expect(names).toContain("Follow-up Email");
    expect(names).toContain("Birthday Greeting");
    expect(names).toContain("Re-engagement Email");
  });

  it("each template has required fields", async () => {
    const { PREBUILT_TEMPLATES } = await import("../email/templates/prebuilt");
    for (const t of PREBUILT_TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.content).toBeTruthy();
      expect(t.isBuiltIn).toBe(true);
    }
  });

  it("all templates have HTML content starting with doctype", async () => {
    const { PREBUILT_TEMPLATES } = await import("../email/templates/prebuilt");
    for (const t of PREBUILT_TEMPLATES) {
      expect(t.content).toMatch(/^<!DOCTYPE html>/);
    }
  });

  it("categorizes templates correctly", async () => {
    const { PREBUILT_TEMPLATES } = await import("../email/templates/prebuilt");
    const categories = PREBUILT_TEMPLATES.map((t) => t.category);
    expect(categories).toContain("welcome");
    expect(categories).toContain("confirmation");
    expect(categories).toContain("booking");
    expect(categories).toContain("reminder");
    expect(categories).toContain("invoice");
    expect(categories).toContain("notification");
    expect(categories).toContain("newsletter");
    expect(categories).toContain("marketing");
  });

  it("templates contain base styles", async () => {
    const { PREBUILT_TEMPLATES } = await import("../email/templates/prebuilt");
    for (const t of PREBUILT_TEMPLATES) {
      expect(t.content).toContain("background:linear-gradient(135deg,#6366f1,#8b5cf6)");
    }
  });

  it("templates contain unsubscribe link", async () => {
    const { PREBUILT_TEMPLATES } = await import("../email/templates/prebuilt");
    for (const t of PREBUILT_TEMPLATES) {
      expect(t.content).toContain("unsubscribe_url");
    }
  });

  it("templates contain variable placeholders", async () => {
    const { PREBUILT_TEMPLATES } = await import("../email/templates/prebuilt");
    const welcome = PREBUILT_TEMPLATES.find((t) => t.name === "Welcome Email")!;
    expect(welcome.content).toContain("{{first_name}}");
    expect(welcome.content).toContain("{{dashboard_url}}");
    expect(welcome.content).toContain("{{company}}");
  });
});

describe("TEMPLATE_CATEGORIES", () => {
  it("exports TEMPLATE_CATEGORIES with expected entries", async () => {
    const { TEMPLATE_CATEGORIES } = await import("../email/templates/prebuilt");
    expect(TEMPLATE_CATEGORIES).toHaveLength(9);

    const values = TEMPLATE_CATEGORIES.map((c) => c.value);
    expect(values).toEqual([
      "welcome", "confirmation", "notification", "newsletter",
      "invoice", "marketing", "booking", "reminder", "custom",
    ]);
  });

  it("each category has label, color, and icon", async () => {
    const { TEMPLATE_CATEGORIES } = await import("../email/templates/prebuilt");
    for (const c of TEMPLATE_CATEGORIES) {
      expect(c.label).toBeTruthy();
      expect(c.color).toContain("bg-");
      expect(c.icon).toBeTruthy();
    }
  });
});

describe("module exports", () => {
  it("exports PREBUILT_TEMPLATES and TEMPLATE_CATEGORIES", async () => {
    const mod = await import("../email/templates/prebuilt");
    expect(Array.isArray(mod.PREBUILT_TEMPLATES)).toBe(true);
    expect(Array.isArray(mod.TEMPLATE_CATEGORIES)).toBe(true);
  });
});
