import { describe, it, expect } from "vitest";
import { z } from "zod";

const contactSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone must be at least 7 digits").max(20).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  projectType: z.string().min(1, "Project type is required"),
  budget: z.string().optional().or(z.literal("")),
  timeline: z.string().optional().or(z.literal("")),
  projectDetails: z.string().min(10, "Please provide at least 10 characters").max(5000),
  projectGoals: z.string().max(2000).optional().or(z.literal("")),
  hasExistingWebsite: z.boolean().optional(),
  existingWebsiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]).optional(),
  referralSource: z.string().max(200).optional().or(z.literal("")),
});

type ContactInput = z.infer<typeof contactSchema>;

function validateContact(data: unknown) {
  return contactSchema.safeParse(data);
}

describe("Contact Validation", () => {
  const validContact: ContactInput = {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    company: "Acme Corp",
    projectType: "web-development",
    budget: "10000-25000",
    timeline: "3-months",
    projectDetails: "We need a complete website redesign with modern technologies and responsive design.",
    projectGoals: "Increase online presence and generate leads",
    hasExistingWebsite: true,
    existingWebsiteUrl: "https://old-site.com",
    preferredContactMethod: "email",
    referralSource: "Google",
  };

  it("passes for valid contact data", () => {
    const result = validateContact(validContact);
    expect(result.success).toBe(true);
  });

  it("fails when fullName is too short", () => {
    const result = validateContact({ ...validContact, fullName: "J" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("fullName");
    }
  });

  it("fails when email is invalid", () => {
    const result = validateContact({ ...validContact, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("fails when projectDetails is too short", () => {
    const result = validateContact({ ...validContact, projectDetails: "Short" });
    expect(result.success).toBe(false);
  });

  it("fails with empty required fields", () => {
    const result = validateContact({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("fullName");
      expect(paths).toContain("email");
      expect(paths).toContain("projectType");
      expect(paths).toContain("projectDetails");
    }
  });

  it("rejects invalid URL for existingWebsiteUrl", () => {
    const result = validateContact({ ...validContact, existingWebsiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid preferredContactMethod", () => {
    const result = validateContact({ ...validContact, preferredContactMethod: "carrier-pigeon" as never });
    expect(result.success).toBe(false);
  });

  it("passes with optional fields omitted", () => {
    const minimal: ContactInput = {
      fullName: "Jane Doe",
      email: "jane@example.com",
      projectType: "consulting",
      projectDetails: "I need help with my business strategy and planning for the next quarter.",
    };
    const result = validateContact(minimal);
    expect(result.success).toBe(true);
  });

  it("handles edge case of very long input", () => {
    const result = validateContact({
      ...validContact,
      fullName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("strips unknown fields", () => {
    const result = validateContact({ ...validContact, unknownField: "should be stripped" });
    if (result.success) {
      expect(result.data).not.toHaveProperty("unknownField");
    }
  });
});
