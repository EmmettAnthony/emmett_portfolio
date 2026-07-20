import { describe, it, expect } from "vitest";
import { BLOG_CATEGORIES } from "../blog-categories";

describe("BLOG_CATEGORIES", () => {
  it("contains expected categories", () => {
    expect(BLOG_CATEGORIES).toContain("Development");
    expect(BLOG_CATEGORIES).toContain("Design");
    expect(BLOG_CATEGORIES).toContain("TypeScript");
    expect(BLOG_CATEGORIES).toContain("React");
    expect(BLOG_CATEGORIES).toContain("Next.js");
    expect(BLOG_CATEGORIES).toContain("Accessibility");
    expect(BLOG_CATEGORIES).toContain("Performance");
    expect(BLOG_CATEGORIES).toContain("Tutorial");
  });

  it("is a readonly tuple", () => {
    expect(Array.isArray(BLOG_CATEGORIES)).toBe(true);
    expect(BLOG_CATEGORIES.length).toBe(8);
  });

  it("all values are strings", () => {
    for (const cat of BLOG_CATEGORIES) {
      expect(typeof cat).toBe("string");
    }
  });
});
