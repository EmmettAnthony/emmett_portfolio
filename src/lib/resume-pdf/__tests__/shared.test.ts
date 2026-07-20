import { describe, it, expect } from "vitest";

describe("resume-pdf shared", () => {
  it("formatDate formats date string to short month year", async () => {
    const { formatDate } = await import("../shared");
    expect(formatDate("2024-01-15")).toBe("Jan 2024");
    expect(formatDate("2023-12-01")).toBe("Dec 2023");
  });

  it("formatDate formats Date objects", async () => {
    const { formatDate } = await import("../shared");
    expect(formatDate(new Date("2024-06-15"))).toBe("Jun 2024");
  });
});

describe("resume-pdf index", () => {
  it("exports all 5 resume PDF templates", async () => {
    const { resumePDFTemplates } = await import("../index");
    expect(Object.keys(resumePDFTemplates)).toEqual([
      "modern",
      "corporate",
      "minimalist",
      "developer",
      "executive",
    ]);
  });

  it("each template is a React component", async () => {
    const { resumePDFTemplates } = await import("../index");
    for (const [name, Component] of Object.entries(resumePDFTemplates)) {
      expect(typeof Component).toBe("function");
    }
  });
});
