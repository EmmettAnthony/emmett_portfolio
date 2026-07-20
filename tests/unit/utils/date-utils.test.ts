import { describe, it, expect } from "vitest";

function formatDate(date: Date, format: "short" | "long" | "iso" = "short"): string {
  switch (format) {
    case "short":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    case "long":
      return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    case "iso":
      return date.toISOString();
  }
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const diffMs = Math.abs(b.getTime() - a.getTime());
  return Math.floor(diffMs / msPerDay);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isOverdue(dueDate: Date): boolean {
  return new Date() > dueDate;
}

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

function getFiscalYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  return month >= 6 ? year + 1 : year;
}

function toTimezone(date: Date, timezone: string): string {
  return date.toLocaleString("en-US", { timeZone: timezone });
}

describe("Date Utilities", () => {
  describe("formatDate", () => {
    it("formats as short by default", () => {
      const date = new Date(2024, 0, 15);
      expect(formatDate(date)).toBe("Jan 15, 2024");
    });

    it("formats as long", () => {
      const date = new Date(2024, 0, 15);
      expect(formatDate(date, "long")).toContain("January");
    });

    it("formats as ISO", () => {
      const date = new Date("2024-01-15T00:00:00.000Z");
      expect(formatDate(date, "iso")).toBe("2024-01-15T00:00:00.000Z");
    });
  });

  describe("daysBetween", () => {
    it("calculates days between two dates", () => {
      const a = new Date("2024-01-01");
      const b = new Date("2024-01-10");
      expect(daysBetween(a, b)).toBe(9);
    });

    it("returns 0 for same day", () => {
      const a = new Date("2024-01-01");
      const b = new Date("2024-01-01");
      expect(daysBetween(a, b)).toBe(0);
    });

    it("handles order reversal", () => {
      const a = new Date("2024-01-10");
      const b = new Date("2024-01-01");
      expect(daysBetween(a, b)).toBe(9);
    });

    it("handles month boundaries", () => {
      const a = new Date("2024-01-31");
      const b = new Date("2024-02-01");
      expect(daysBetween(a, b)).toBe(1);
    });
  });

  describe("addDays", () => {
    it("adds positive days", () => {
      const date = new Date("2024-01-01");
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    it("adds negative days", () => {
      const date = new Date("2024-01-10");
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(5);
    });

    it("wraps months correctly", () => {
      const date = new Date("2024-01-30");
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(4);
    });
  });

  describe("isOverdue", () => {
    it("returns true for past date", () => {
      expect(isOverdue(new Date("2020-01-01"))).toBe(true);
    });

    it("returns false for future date", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(isOverdue(future)).toBe(false);
    });
  });

  describe("getQuarter", () => {
    it("returns Q1 for January", () => expect(getQuarter(new Date(2024, 0, 1))).toBe(1));
    it("returns Q1 for March", () => expect(getQuarter(new Date(2024, 2, 1))).toBe(1));
    it("returns Q2 for April", () => expect(getQuarter(new Date(2024, 3, 1))).toBe(2));
    it("returns Q4 for December", () => expect(getQuarter(new Date(2024, 11, 1))).toBe(4));
  });

  describe("getFiscalYear", () => {
    it("returns FY 2024 for January 2024", () => {
      expect(getFiscalYear(new Date(2024, 0, 1))).toBe(2024);
    });
    it("returns FY 2025 for July 2024", () => {
      expect(getFiscalYear(new Date(2024, 6, 1))).toBe(2025);
    });
  });

  describe("toTimezone", () => {
    it("converts to a different timezone", () => {
      const date = new Date("2024-01-15T12:00:00.000Z");
      const result = toTimezone(date, "America/New_York");
      expect(result).toContain("2024");
    });
  });
});
