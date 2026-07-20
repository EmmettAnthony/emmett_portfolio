import { describe, it, expect } from "vitest";
import {
  contactFormSchema,
  PROJECT_TYPES,
  BUDGET_RANGES,
  TIMELINE_OPTIONS,
} from "../validations/contact";

describe("PROJECT_TYPES", () => {
  it("has correct structure", () => {
    expect(PROJECT_TYPES).toEqual([
      { value: "web_development", label: "Web Development" },
      { value: "mobile_app", label: "Mobile App" },
      { value: "crm_system", label: "CRM System" },
      { value: "ecommerce", label: "E-Commerce" },
      { value: "api_integration", label: "API Integration" },
      { value: "consulting", label: "Consulting" },
      { value: "wordpress", label: "WordPress" },
      { value: "other", label: "Other" },
    ]);
  });
});

describe("BUDGET_RANGES", () => {
  it("has correct structure", () => {
    expect(BUDGET_RANGES).toEqual([
      { value: "under_1000", label: "Under $1,000" },
      { value: "1000_5000", label: "$1,000 - $5,000" },
      { value: "5000_10000", label: "$5,000 - $10,000" },
      { value: "10000_25000", label: "$10,000 - $25,000" },
      { value: "25000_plus", label: "$25,000+" },
      { value: "not_sure", label: "Not Sure" },
    ]);
  });
});

describe("TIMELINE_OPTIONS", () => {
  it("has correct structure", () => {
    expect(TIMELINE_OPTIONS).toEqual([
      { value: "asap", label: "ASAP (1-2 weeks)" },
      { value: "short", label: "Short (2-4 weeks)" },
      { value: "medium", label: "Medium (1-3 months)" },
      { value: "flexible", label: "Flexible (3+ months)" },
      { value: "not_sure", label: "Not Sure" },
    ]);
  });
});

describe("contactFormSchema", () => {
  it("parses valid contact form", () => {
    const result = contactFormSchema.parse({
      name: "John Doe",
      email: "john@example.com",
      projectType: "web_development",
      subject: "Project Inquiry",
      message: "I would like to discuss a new web development project. Can we set up a call?",
    });
    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.projectType).toBe("web_development");
    expect(result.subject).toBe("Project Inquiry");
    expect(result.message.length).toBeGreaterThanOrEqual(10);
    expect(result.budget).toBe("");
    expect(result.timeline).toBe("");
    expect(result.fileUrl).toBe("");
    expect(result.fileName).toBe("");
    expect(result.honeypot).toBe("");
  });

  it("rejects empty name", () => {
    const result = contactFormSchema.safeParse({
      name: "",
      email: "john@example.com",
      projectType: "web_development",
      subject: "Subject",
      message: "Message that is long enough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "bad",
      projectType: "web_development",
      subject: "Subject",
      message: "Message that is long enough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid projectType", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "john@example.com",
      projectType: "invalid_type",
      subject: "Subject",
      message: "Message that is long enough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "john@example.com",
      projectType: "web_development",
      subject: "",
      message: "Message that is long enough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects subject over 500 chars", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "john@example.com",
      projectType: "web_development",
      subject: "S".repeat(501),
      message: "Message that is long enough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message under 10 characters", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "john@example.com",
      projectType: "web_development",
      subject: "Subject",
      message: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message over 5000 characters", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "john@example.com",
      projectType: "web_development",
      subject: "Subject",
      message: "M".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = contactFormSchema.parse({
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      company: "Acme Inc",
      projectType: "ecommerce",
      budget: "5000_10000",
      timeline: "short",
      subject: "Subject",
      message: "I need an ecommerce website built. Let me know if you have availability.",
      fileUrl: "https://example.com/file.pdf",
      fileName: "brief.pdf",
      honeypot: "",
      turnstileToken: "token_123",
    });
    expect(result.phone).toBe("+1234567890");
    expect(result.company).toBe("Acme Inc");
    expect(result.budget).toBe("5000_10000");
    expect(result.timeline).toBe("short");
    expect(result.fileUrl).toBe("https://example.com/file.pdf");
    expect(result.turnstileToken).toBe("token_123");
  });

  it("rejects honeypot with content", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "john@example.com",
      projectType: "web_development",
      subject: "Subject",
      message: "Message that is long enough",
      honeypot: "bot content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 255 chars", () => {
    const result = contactFormSchema.safeParse({
      name: "N".repeat(256),
      email: "john@example.com",
      projectType: "web_development",
      subject: "Subject",
      message: "Message that is long enough",
    });
    expect(result.success).toBe(false);
  });

  it("rejects email over 320 chars", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "j".repeat(321) + "@example.com",
      projectType: "web_development",
      subject: "Subject",
      message: "Message that is long enough",
    });
    expect(result.success).toBe(false);
  });
});
