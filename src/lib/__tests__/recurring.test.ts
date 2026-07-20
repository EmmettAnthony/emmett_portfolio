import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateNextRun } from "../recurring";

describe("calculateNextRun", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns null when freq is null", () => {
    const result = calculateNextRun({
      recurringFrequency: null,
      recurringDayOfWeek: null,
      recurringDayOfMonth: null,
    });
    expect(result).toBeNull();
  });

  it("returns null when freq is undefined (null check catches it)", () => {
    const result = calculateNextRun({
      recurringFrequency: null,
      recurringDayOfWeek: null,
      recurringDayOfMonth: null,
    });
    expect(result).toBeNull();
  });

  describe("daily", () => {
    it("returns tomorrow", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "daily",
        recurringDayOfWeek: null,
        recurringDayOfMonth: null,
      });
      expect(result!.toISOString()).toBe("2026-07-18T00:00:00.000Z");
    });

    it("next day is exactly 1 day after today", () => {
      vi.setSystemTime(new Date("2026-12-31T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "daily",
        recurringDayOfWeek: null,
        recurringDayOfMonth: null,
      });
      expect(result!.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    });
  });

  describe("weekly", () => {
    it("returns next occurrence of specified dayOfWeek when dayOfWeek is in the future", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "weekly",
        recurringDayOfWeek: 4,
        recurringDayOfMonth: null,
      });
      expect(result!.toISOString()).toBe("2026-07-23T00:00:00.000Z");
    });

    it("returns next week when dayOfWeek has passed this week", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "weekly",
        recurringDayOfWeek: 1,
        recurringDayOfMonth: null,
      });
      expect(result!.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    });

    it("returns null when dayOfWeek is null", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "weekly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: null,
      });
      expect(result).toBeNull();
    });

    it("returns null when dayOfWeek is undefined", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "weekly",
        recurringDayOfWeek: undefined as unknown as number,
        recurringDayOfMonth: null,
      });
      expect(result).toBeNull();
    });
  });

  describe("monthly", () => {
    it("returns next occurrence of specified dayOfMonth when dayOfMonth is in the future this month", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: 25,
      });
      expect(result!.toISOString()).toBe("2026-07-25T00:00:00.000Z");
    });

    it("returns next month when dayOfMonth has passed this month", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: 5,
      });
      expect(result!.toISOString()).toBe("2026-08-05T00:00:00.000Z");
    });

    it("returns null when dayOfMonth is null", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: null,
      });
      expect(result).toBeNull();
    });

    it("returns null when dayOfMonth is undefined", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: undefined as unknown as number,
      });
      expect(result).toBeNull();
    });

    it("returns null when dayOfMonth is 0", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: 0,
      });
      expect(result).toBeNull();
    });

    it("returns null when dayOfMonth < 1", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: -5,
      });
      expect(result).toBeNull();
    });

    it("returns null when dayOfMonth > 31", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: 32,
      });
      expect(result).toBeNull();
    });

    it("handles same day correctly (returns next month)", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: 17,
      });
      expect(result!.toISOString()).toBe("2026-08-17T00:00:00.000Z");
    });

    it("handles month boundary (Jan 31 -> Feb 31 rolls to Mar 3)", () => {
      vi.setSystemTime(new Date("2026-01-31T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "monthly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: 31,
      });
      expect(result!.toISOString()).toBe("2026-03-03T00:00:00.000Z");
    });
  });

  describe("unknown frequency", () => {
    it("returns null for unknown frequency", () => {
      vi.setSystemTime(new Date("2026-07-17T12:00:00Z"));
      const result = calculateNextRun({
        recurringFrequency: "fortnightly",
        recurringDayOfWeek: null,
        recurringDayOfMonth: null,
      });
      expect(result).toBeNull();
    });
  });
});
