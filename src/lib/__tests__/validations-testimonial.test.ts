import { describe, it, expect } from "vitest";
import {
  testimonialSchema,
  testimonialSubmissionSchema,
  TESTIMONIAL_CATEGORIES,
} from "../validations/testimonial";

describe("TESTIMONIAL_CATEGORIES", () => {
  it("contains all categories", () => {
    expect(TESTIMONIAL_CATEGORIES).toEqual([
      "Web Development",
      "E-Commerce",
      "Software Development",
      "WordPress Development",
      "Consulting",
      "Website Maintenance",
    ]);
  });

  it("has correct values", () => {
    expect(TESTIMONIAL_CATEGORIES).toHaveLength(6);
    expect(TESTIMONIAL_CATEGORIES[0]).toBe("Web Development");
    expect(TESTIMONIAL_CATEGORIES[1]).toBe("E-Commerce");
    expect(TESTIMONIAL_CATEGORIES[2]).toBe("Software Development");
    expect(TESTIMONIAL_CATEGORIES[3]).toBe("WordPress Development");
    expect(TESTIMONIAL_CATEGORIES[4]).toBe("Consulting");
    expect(TESTIMONIAL_CATEGORIES[5]).toBe("Website Maintenance");
  });
});

describe("testimonialSchema", () => {
  it("parses valid testimonial", () => {
    const result = testimonialSchema.parse({
      name: "John Doe",
      content: "Great work!",
      rating: 5,
    });
    expect(result.name).toBe("John Doe");
    expect(result.content).toBe("Great work!");
    expect(result.rating).toBe(5);
    expect(result.jobTitle).toBe("");
    expect(result.company).toBe("");
    expect(result.companyWebsite).toBe("");
    expect(result.email).toBe("");
    expect(result.photo).toBe("");
    expect(result.companyLogo).toBe("");
    expect(result.title).toBe("");
    expect(result.projectName).toBe("");
    expect(result.projectCategory).toBe("");
    expect(result.category).toBe("");
    expect(result.status).toBe("PENDING_REVIEW");
    expect(result.featured).toBe(false);
    expect(result.displayOnHomepage).toBe(true);
    expect(result.archived).toBe(false);
    expect(result.order).toBe(0);
    expect(result.metaTitle).toBe("");
    expect(result.metaDescription).toBe("");
    expect(result.ogImage).toBe("");
  });

  it("rejects empty name", () => {
    const result = testimonialSchema.safeParse({
      name: "",
      content: "Great!",
      rating: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = testimonialSchema.safeParse({
      name: "John",
      content: "",
      rating: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects content over 1000 chars", () => {
    const result = testimonialSchema.safeParse({
      name: "John",
      content: "C".repeat(1001),
      rating: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating below 1", () => {
    const result = testimonialSchema.safeParse({
      name: "John",
      content: "Great!",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = testimonialSchema.safeParse({
      name: "John",
      content: "Great!",
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    const result = testimonialSchema.safeParse({
      name: "John",
      content: "Great!",
      rating: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts full data with all fields", () => {
    const result = testimonialSchema.parse({
      name: "John Doe",
      jobTitle: "CEO",
      company: "Acme Inc",
      companyWebsite: "https://acme.com",
      email: "john@acme.com",
      photo: "https://example.com/photo.jpg",
      companyLogo: "https://example.com/logo.png",
      title: "Excellent Service",
      content: "Amazing work on our project!",
      rating: 5,
      projectName: "Website Redesign",
      projectCategory: "Web Development",
      category: "Web Development",
      status: "APPROVED",
      featured: true,
      displayOnHomepage: true,
      archived: false,
      order: 1,
      metaTitle: "SEO Title",
      metaDescription: "SEO Desc",
      ogImage: "https://example.com/og.jpg",
    });
    expect(result.jobTitle).toBe("CEO");
    expect(result.companyWebsite).toBe("https://acme.com");
    expect(result.status).toBe("APPROVED");
    expect(result.featured).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = testimonialSchema.safeParse({
      name: "John",
      content: "Great!",
      rating: 5,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL in companyWebsite", () => {
    const result = testimonialSchema.safeParse({
      name: "John",
      content: "Great!",
      rating: 5,
      companyWebsite: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string in optional URL fields", () => {
    const result = testimonialSchema.parse({
      name: "John",
      content: "Great!",
      rating: 5,
      companyWebsite: "",
      email: "",
      photo: "",
      companyLogo: "",
      ogImage: "",
    });
    expect(result.companyWebsite).toBe("");
    expect(result.email).toBe("");
  });

  it("rejects name over 200 chars", () => {
    const result = testimonialSchema.safeParse({
      name: "N".repeat(201),
      content: "Great!",
      rating: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe("testimonialSubmissionSchema", () => {
  it("parses valid submission", () => {
    const result = testimonialSubmissionSchema.parse({
      name: "John Doe",
      content: "Great work!",
    });
    expect(result.name).toBe("John Doe");
    expect(result.content).toBe("Great work!");
    expect(result.rating).toBe(5);
    expect(result.email).toBe("");
    expect(result.company).toBe("");
    expect(result.jobTitle).toBe("");
    expect(result.photo).toBe("");
  });

  it("rejects empty name", () => {
    const result = testimonialSubmissionSchema.safeParse({
      name: "",
      content: "Great!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = testimonialSubmissionSchema.safeParse({
      name: "John",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content over 1000 chars", () => {
    const result = testimonialSubmissionSchema.safeParse({
      name: "John",
      content: "C".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("applies default rating of 5", () => {
    const result = testimonialSubmissionSchema.parse({
      name: "John",
      content: "Great!",
    });
    expect(result.rating).toBe(5);
  });

  it("accepts custom rating", () => {
    const result = testimonialSubmissionSchema.parse({
      name: "John",
      content: "Good",
      rating: 3,
    });
    expect(result.rating).toBe(3);
  });

  it("rejects rating below 1", () => {
    const result = testimonialSubmissionSchema.safeParse({
      name: "John",
      content: "Great!",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = testimonialSubmissionSchema.parse({
      name: "John",
      email: "john@example.com",
      company: "Acme",
      jobTitle: "CEO",
      photo: "https://example.com/photo.jpg",
      content: "Great!",
    });
    expect(result.email).toBe("john@example.com");
    expect(result.company).toBe("Acme");
  });

  it("rejects invalid email", () => {
    const result = testimonialSubmissionSchema.safeParse({
      name: "John",
      email: "bad",
      content: "Great!",
    });
    expect(result.success).toBe(false);
  });
});
