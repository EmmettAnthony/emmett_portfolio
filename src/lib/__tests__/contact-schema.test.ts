import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  contactSchema,
  projectTypes,
  budgetRanges,
  timelines,
  referralSources,
  communicationMethods,
  validateFile,
  calculateLeadScore,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "../contact-schema";

const validData = {
  fullName: "John Doe",
  email: "john@example.com",
  projectType: "Web Application",
  projectDetails: "I need a web application built with Next.js and TypeScript for my startup.",
};

describe("contactSchema", () => {
  it("validates valid data with all required fields", () => {
    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects short fullName", () => {
    const result = contactSchema.safeParse({ ...validData, fullName: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name must be at least 2 characters");
    }
  });

  it("rejects long fullName", () => {
    const result = contactSchema.safeParse({ ...validData, fullName: "A".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is too long");
    }
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid email address");
    }
  });

  it("rejects invalid projectType", () => {
    const result = contactSchema.safeParse({ ...validData, projectType: "Invalid Type" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please select a project type");
    }
  });

  it("rejects short projectDetails", () => {
    const result = contactSchema.safeParse({ ...validData, projectDetails: "Too short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please provide at least 20 characters describing your project");
    }
  });

  it("rejects long projectDetails", () => {
    const result = contactSchema.safeParse({ ...validData, projectDetails: "A".repeat(5001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Project details must be under 5000 characters");
    }
  });

  it("accepts valid optional fields", () => {
    const result = contactSchema.safeParse({
      ...validData,
      company: "Acme Corp",
      phone: "+1 555-1234",
      budget: "$5,000 - $10,000",
      timeline: "1-3 Months",
      website: "https://example.com",
      startDate: "2026-08-01",
      referralSource: "LinkedIn",
      projectGoals: "Increase online presence and generate leads.",
      hasExistingWebsite: true,
      existingWebsiteUrl: "https://oldsite.com",
      preferredContactMethod: "Email",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone format", () => {
    const result = contactSchema.safeParse({ ...validData, phone: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid phone number");
    }
  });

  it("rejects invalid website URL", () => {
    const result = contactSchema.safeParse({ ...validData, website: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid URL");
    }
  });

  it("rejects invalid budget enum value", () => {
    const result = contactSchema.safeParse({ ...validData, budget: "Millions" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid timeline enum value", () => {
    const result = contactSchema.safeParse({ ...validData, timeline: "Next Year" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid referral source", () => {
    const result = contactSchema.safeParse({ ...validData, referralSource: "Billboard" });
    expect(result.success).toBe(false);
  });

  it("rejects honeypot with value", () => {
    const result = contactSchema.safeParse({ ...validData, honeypot: "I am a bot" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Bot detected");
    }
  });

  it("accepts valid data with empty strings for optionals", () => {
    const result = contactSchema.safeParse({
      ...validData,
      company: "",
      phone: "",
      budget: "",
      timeline: "",
      website: "",
      startDate: "",
      referralSource: "",
      projectGoals: "",
      existingWebsiteUrl: "",
      preferredContactMethod: "",
    });
    expect(result.success).toBe(true);
  });

  it("validates all projectType enum values", () => {
    for (const pt of projectTypes) {
      const result = contactSchema.safeParse({ ...validData, projectType: pt });
      expect(result.success).toBe(true);
    }
  });

  it("validates all budgetRanges enum values", () => {
    for (const br of budgetRanges) {
      const result = contactSchema.safeParse({ ...validData, budget: br });
      expect(result.success).toBe(true);
    }
  });

  it("validates all timelines enum values", () => {
    for (const tl of timelines) {
      const result = contactSchema.safeParse({ ...validData, timeline: tl });
      expect(result.success).toBe(true);
    }
  });

  it("validates all referralSources enum values", () => {
    for (const rs of referralSources) {
      const result = contactSchema.safeParse({ ...validData, referralSource: rs });
      expect(result.success).toBe(true);
    }
  });

  it("validates all communicationMethods enum values", () => {
    for (const cm of communicationMethods) {
      const result = contactSchema.safeParse({ ...validData, preferredContactMethod: cm });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid existingWebsiteUrl", () => {
    const result = contactSchema.safeParse({ ...validData, existingWebsiteUrl: "bad-url" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid preferredContactMethod", () => {
    const result = contactSchema.safeParse({ ...validData, preferredContactMethod: "Telegram" });
    expect(result.success).toBe(false);
  });

  it("accepts missing optional fields entirely", () => {
    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts hasExistingWebsite as boolean", () => {
    const r1 = contactSchema.safeParse({ ...validData, hasExistingWebsite: true });
    const r2 = contactSchema.safeParse({ ...validData, hasExistingWebsite: false });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});

describe("validateFile", () => {
  it("returns null for accepted PDF file", () => {
    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    expect(validateFile(file)).toBeNull();
  });

  it("returns null for accepted DOCX file", () => {
    const file = new File(["dummy"], "test.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    expect(validateFile(file)).toBeNull();
  });

  it("returns null for accepted PNG file", () => {
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    expect(validateFile(file)).toBeNull();
  });

  it("returns null for accepted JPEG file", () => {
    const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
    expect(validateFile(file)).toBeNull();
  });

  it("returns error for rejected file type", () => {
    const file = new File(["dummy"], "test.gif", { type: "image/gif" });
    const result = validateFile(file);
    expect(result).toBe("Invalid file type. Accepted: PDF, DOCX, PNG, JPG");
  });

  it("returns error for file exceeding MAX_FILE_SIZE", () => {
    const oversized = new File(["x".repeat(MAX_FILE_SIZE + 1)], "large.pdf", { type: "application/pdf" });
    const result = validateFile(oversized);
    expect(result).toBe("File is too large. Maximum size is 10MB");
  });

  it("returns null for file within size limit", () => {
    const small = new File(["x".repeat(1024)], "small.pdf", { type: "application/pdf" });
    expect(validateFile(small)).toBeNull();
  });

  it("returns error for oversized non-PDF file", () => {
    const oversized = new File(["x".repeat(MAX_FILE_SIZE + 1)], "large.png", { type: "image/png" });
    const result = validateFile(oversized);
    expect(result).toBe("File is too large. Maximum size is 10MB");
  });

  it("returns error for empty file with invalid type", () => {
    const empty = new File([], "empty.txt", { type: "text/plain" });
    const result = validateFile(empty);
    expect(result).toBe("Invalid file type. Accepted: PDF, DOCX, PNG, JPG");
  });
});

describe("calculateLeadScore", () => {
const base = {
  fullName: "",
  email: "john@example.com",
  projectType: "Web Application",
  projectDetails: "",
  company: undefined,
  phone: undefined,
  budget: undefined,
  timeline: undefined,
  website: undefined,
  startDate: undefined,
  referralSource: undefined,
  projectGoals: undefined,
  hasExistingWebsite: undefined,
  existingWebsiteUrl: undefined,
  preferredContactMethod: undefined,
} as const;

  it("returns 0 for minimal data", () => {
    expect(calculateLeadScore({ ...base })).toBe(0);
  });

  it("scores Under $500 budget as 5", () => {
    const score = calculateLeadScore({ ...base, budget: "Under $500" });
    expect(score).toBe(5);
  });

  it("scores $500 - $1,000 budget as 10", () => {
    const score = calculateLeadScore({ ...base, budget: "$500 - $1,000" });
    expect(score).toBe(10);
  });

  it("scores $1,000 - $5,000 budget as 20", () => {
    const score = calculateLeadScore({ ...base, budget: "$1,000 - $5,000" });
    expect(score).toBe(20);
  });

  it("scores $5,000 - $10,000 budget as 30", () => {
    const score = calculateLeadScore({ ...base, budget: "$5,000 - $10,000" });
    expect(score).toBe(30);
  });

  it("scores $10,000+ budget as 30", () => {
    const score = calculateLeadScore({ ...base, budget: "$10,000+" });
    expect(score).toBe(30);
  });

  it("scores Previous Client referral as 20", () => {
    const score = calculateLeadScore({ ...base, referralSource: "Previous Client" });
    expect(score).toBe(20);
  });

  it("scores Referral referral as 20", () => {
    const score = calculateLeadScore({ ...base, referralSource: "Referral" });
    expect(score).toBe(20);
  });

  it("scores LinkedIn referral as 10", () => {
    const score = calculateLeadScore({ ...base, referralSource: "LinkedIn" });
    expect(score).toBe(10);
  });

  it("scores GitHub referral as 10", () => {
    const score = calculateLeadScore({ ...base, referralSource: "GitHub" });
    expect(score).toBe(10);
  });

  it("does not score Google Search referral", () => {
    const score = calculateLeadScore({ ...base, referralSource: "Google Search" });
    expect(score).toBe(0);
  });

  it("scores 5 for each profile completeness field", () => {
    const data = {
      ...base,
      fullName: "Jane Doe",
      company: "Acme",
      phone: "555-0000",
      website: "https://acme.com",
      projectGoals: "Grow business",
      preferredContactMethod: "Email",
    };
    const score = calculateLeadScore(data);
    expect(score).toBe(30);
  });

  it("scores long projectDetails (>100 chars) as 10", () => {
    const data = { ...base, projectDetails: "A".repeat(101) };
    const score = calculateLeadScore(data);
    expect(score).toBe(10);
  });

  it("scores medium projectDetails (51-100 chars) as 5", () => {
    const data = { ...base, projectDetails: "A".repeat(51) };
    const score = calculateLeadScore(data);
    expect(score).toBe(5);
  });

  it("scores short projectDetails (<=50 chars) as 0", () => {
    const data = { ...base, projectDetails: "A".repeat(50) };
    const score = calculateLeadScore(data);
    expect(score).toBe(0);
  });

  it("scores ASAP timeline as 10", () => {
    const score = calculateLeadScore({ ...base, timeline: "ASAP" });
    expect(score).toBe(10);
  });

  it("scores Within 1 Month timeline as 5", () => {
    const score = calculateLeadScore({ ...base, timeline: "Within 1 Month" });
    expect(score).toBe(5);
  });

  it("caps score at 100", () => {
    const data = {
      ...base,
      budget: "$10,000+",
      referralSource: "Previous Client",
      fullName: "Max",
      company: "Corp",
      phone: "555-1111",
      website: "https://max.com",
      projectGoals: "Scale globally",
      preferredContactMethod: "Phone",
      projectDetails: "A".repeat(101),
      timeline: "ASAP",
    };
    const score = calculateLeadScore(data);
    expect(score).toBe(100);
  });

  it("combines budget + referral + profile + details + timeline correctly", () => {
    const data = {
      ...base,
      budget: "$1,000 - $5,000",
      referralSource: "Referral",
      company: "Corp",
      phone: "555-1111",
      projectDetails: "A".repeat(101),
      timeline: "Within 1 Month",
    };
    const score = calculateLeadScore(data);
    expect(score).toBe(20 + 20 + 5 + 5 + 10 + 5);
  });
});
