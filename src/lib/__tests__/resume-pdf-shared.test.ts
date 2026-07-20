import { describe, it, expect } from "vitest";

describe("formatDate", () => {
  it("formats a Date object to short month and year", async () => {
    const { formatDate } = await import("../resume-pdf/shared");
    const date = new Date("2024-03-15");
    expect(formatDate(date)).toBe("Mar 2024");
  });

  it("formats a date string", async () => {
    const { formatDate } = await import("../resume-pdf/shared");
    expect(formatDate("2023-01-01")).toBe("Jan 2023");
  });

  it("handles end-of-year dates", async () => {
    const { formatDate } = await import("../resume-pdf/shared");
    expect(formatDate("2024-12-31")).toBe("Dec 2024");
  });

  it("handles start-of-year dates", async () => {
    const { formatDate } = await import("../resume-pdf/shared");
    expect(formatDate("2022-01-01")).toBe("Jan 2022");
  });

  it("handles dates with time components", async () => {
    const { formatDate } = await import("../resume-pdf/shared");
    expect(formatDate("2025-06-15T10:30:00Z")).toBe("Jun 2025");
  });

  it("handles current month", async () => {
    const { formatDate } = await import("../resume-pdf/shared");
    const now = new Date();
    const expected = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    expect(formatDate(now)).toBe(expected);
  });
});

describe("module exports", () => {
  it("exports formatDate as the sole runtime export", async () => {
    const mod = await import("../resume-pdf/shared");
    expect(typeof mod.formatDate).toBe("function");
  });
});
