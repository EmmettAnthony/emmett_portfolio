import { describe, it, expect } from "vitest";
import { cn, formatDate, readTime } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toContain("px-4");
    expect(cn("px-4", "py-2")).toContain("py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("deduplicates conflicting tailwind classes", () => {
    const result = cn("px-4", "px-2");
    expect(result).not.toContain("px-4");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-03-15");
    expect(result).toContain("March");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("handles ISO date strings", () => {
    const result = formatDate("2024-06-01T12:00:00Z");
    expect(result).toContain("June");
  });
});

describe("readTime", () => {
  it("calculates read time for short content", () => {
    expect(readTime("hello world")).toBe(1);
  });

  it("calculates read time for 400 words", () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    expect(readTime(words)).toBe(2);
  });

  it("returns 1 for empty content", () => {
    expect(readTime("")).toBe(1);
  });
});
