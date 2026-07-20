import { describe, it, expect } from "vitest";
import {
  contactFormSchema,
  PROJECT_TYPES,
  BUDGET_RANGES,
  TIMELINE_OPTIONS,
} from "@/lib/validations/contact";

describe("contactFormSchema", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    projectType: "web_development",
    subject: "Project Inquiry",
    message: "I'd like to discuss a new web development project.",
  };

  it("passes valid data with only required fields", () => {
    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      // Defaults should be applied
      expect(result.data.budget).toBe("");
      expect(result.data.timeline).toBe("");
      expect(result.data.fileUrl).toBe("");
      expect(result.data.fileName).toBe("");
      expect(result.data.honeypot).toBe("");
    }
  });

  it("passes valid data with all optional fields filled", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      phone: "+1 555-0000",
      company: "Acme Inc",
      projectType: "mobile_app",
      budget: "1000_5000",
      timeline: "medium",
      fileUrl: "https://uploadthing.com/f/abc123",
      fileName: "project-brief.pdf",
      turnstileToken: "0.token.abc",
    });
    expect(result.success).toBe(true);
  });

  // ─── name ────────────────────────────────────────────────────────────────

  it("fails without name", () => {
    const result = contactFormSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
  });

  it("fails with name exceeding max length", () => {
    const result = contactFormSchema.safeParse({ ...validData, name: "A".repeat(256) });
    expect(result.success).toBe(false);
  });

  // ─── email ───────────────────────────────────────────────────────────────

  it("fails with invalid email", () => {
    const result = contactFormSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("fails with email exceeding max length", () => {
    const result = contactFormSchema.safeParse({ ...validData, email: `${"a".repeat(321)}@b.com` });
    expect(result.success).toBe(false);
  });

  // ─── projectType ─────────────────────────────────────────────────────────

  it("fails without projectType", () => {
    const result = contactFormSchema.safeParse({ ...validData, projectType: "" });
    expect(result.success).toBe(false);
  });

  it("fails when projectType is missing entirely", () => {
    const data = { ...validData };
    delete data.projectType;
    const result = contactFormSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("returns correct error message for missing projectType", () => {
    const result = contactFormSchema.safeParse({ ...validData, projectType: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please select a valid project type");
    }
  });

  it("accepts all valid project type values", () => {
    const values = PROJECT_TYPES.map((p) => p.value);
    for (const value of values) {
      const result = contactFormSchema.safeParse({ ...validData, projectType: value });
      expect(result.success).toBe(true);
    }
  });

  // ─── budget ──────────────────────────────────────────────────────────────

  it("accepts missing budget (optional, defaults to empty string)", () => {
    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budget).toBe("");
    }
  });

  it("accepts all valid budget range values", () => {
    const values = BUDGET_RANGES.map((b) => b.value);
    for (const value of values) {
      const result = contactFormSchema.safeParse({ ...validData, budget: value });
      expect(result.success).toBe(true);
    }
  });

  it("accepts budget set to empty string", () => {
    const result = contactFormSchema.safeParse({ ...validData, budget: "" });
    expect(result.success).toBe(true);
  });

  // ─── timeline ────────────────────────────────────────────────────────────

  it("accepts missing timeline (optional, defaults to empty string)", () => {
    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeline).toBe("");
    }
  });

  it("accepts all valid timeline option values", () => {
    const values = TIMELINE_OPTIONS.map((t) => t.value);
    for (const value of values) {
      const result = contactFormSchema.safeParse({ ...validData, timeline: value });
      expect(result.success).toBe(true);
    }
  });

  it("accepts timeline set to empty string", () => {
    const result = contactFormSchema.safeParse({ ...validData, timeline: "" });
    expect(result.success).toBe(true);
  });

  // ─── fileUrl & fileName ──────────────────────────────────────────────────

  it("accepts missing fileUrl and fileName (optional, both default to empty string)", () => {
    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fileUrl).toBe("");
      expect(result.data.fileName).toBe("");
    }
  });

  it("accepts fileUrl with a valid URL", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      fileUrl: "https://utfs.io/f/abc123/image.pdf",
      fileName: "document.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("accepts fileUrl with a non-URL string (no URL validation enforced)", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      fileUrl: "just-a-string",
    });
    expect(result.success).toBe(true);
  });

  // ─── subject ─────────────────────────────────────────────────────────────

  it("fails without subject", () => {
    const result = contactFormSchema.safeParse({ ...validData, subject: "" });
    expect(result.success).toBe(false);
  });

  it("fails with subject exceeding max length", () => {
    const result = contactFormSchema.safeParse({ ...validData, subject: "A".repeat(501) });
    expect(result.success).toBe(false);
  });

  // ─── message ─────────────────────────────────────────────────────────────

  it("fails with short message", () => {
    const result = contactFormSchema.safeParse({ ...validData, message: "Hi" });
    expect(result.success).toBe(false);
  });

  it("returns correct error message for short message", () => {
    const result = contactFormSchema.safeParse({ ...validData, message: "Hi" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Message must be at least 10 characters");
    }
  });

  it("fails with message exceeding max length", () => {
    const result = contactFormSchema.safeParse({ ...validData, message: "A".repeat(5001) });
    expect(result.success).toBe(false);
  });

  // ─── phone & company (optional) ──────────────────────────────────────────

  it("accepts optional phone and company", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      phone: "+1 555-0000",
      company: "Acme Inc",
    });
    expect(result.success).toBe(true);
  });

  it("accepts phone as null", () => {
    const result = contactFormSchema.safeParse({ ...validData, phone: null });
    expect(result.success).toBe(true);
  });

  it("accepts company as null", () => {
    const result = contactFormSchema.safeParse({ ...validData, company: null });
    expect(result.success).toBe(true);
  });

  it("fails with phone exceeding max length", () => {
    const result = contactFormSchema.safeParse({ ...validData, phone: "A".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("fails with company exceeding max length", () => {
    const result = contactFormSchema.safeParse({ ...validData, company: "A".repeat(256) });
    expect(result.success).toBe(false);
  });

  // ─── honeypot ────────────────────────────────────────────────────────────

  it("rejects honeypot with value", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      honeypot: "I am a bot",
    });
    expect(result.success).toBe(false);
  });

  it("rejects honeypot and returns correct error message", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      honeypot: "bot",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Bot detected");
    }
  });

  it("accepts honeypot as empty (default)", () => {
    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.honeypot).toBe("");
    }
  });

  // ─── turnstileToken ──────────────────────────────────────────────────────

  it("accepts turnstile token", () => {
    const result = contactFormSchema.safeParse({
      ...validData,
      turnstileToken: "0.token.abc",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing turnstile token", () => {
    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

// ─── Exported Constants ──────────────────────────────────────────────────────

describe("PROJECT_TYPES", () => {
  it("has all expected entries with value and label", () => {
    expect(PROJECT_TYPES).toHaveLength(8);
    const values = PROJECT_TYPES.map((p) => p.value);
    expect(values).toContain("web_development");
    expect(values).toContain("mobile_app");
    expect(values).toContain("crm_system");
    expect(values).toContain("ecommerce");
    expect(values).toContain("api_integration");
    expect(values).toContain("consulting");
    expect(values).toContain("wordpress");
    expect(values).toContain("other");

    for (const entry of PROJECT_TYPES) {
      expect(entry).toHaveProperty("value");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.value).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique values", () => {
    const values = PROJECT_TYPES.map((p) => p.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("BUDGET_RANGES", () => {
  it("has all expected entries with value and label", () => {
    expect(BUDGET_RANGES).toHaveLength(6);
    const values = BUDGET_RANGES.map((b) => b.value);
    expect(values).toContain("under_1000");
    expect(values).toContain("1000_5000");
    expect(values).toContain("5000_10000");
    expect(values).toContain("10000_25000");
    expect(values).toContain("25000_plus");
    expect(values).toContain("not_sure");

    for (const entry of BUDGET_RANGES) {
      expect(entry).toHaveProperty("value");
      expect(entry).toHaveProperty("label");
    }
  });

  it("has unique values", () => {
    const values = BUDGET_RANGES.map((b) => b.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("TIMELINE_OPTIONS", () => {
  it("has all expected entries with value and label", () => {
    expect(TIMELINE_OPTIONS).toHaveLength(5);
    const values = TIMELINE_OPTIONS.map((t) => t.value);
    expect(values).toContain("asap");
    expect(values).toContain("short");
    expect(values).toContain("medium");
    expect(values).toContain("flexible");
    expect(values).toContain("not_sure");

    for (const entry of TIMELINE_OPTIONS) {
      expect(entry).toHaveProperty("value");
      expect(entry).toHaveProperty("label");
    }
  });

  it("has unique values", () => {
    const values = TIMELINE_OPTIONS.map((t) => t.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
