import { describe, it, expect } from "vitest";
import { chiSquarePValue, formatPValue, isSignificant } from "../stats";

describe("chiSquarePValue", () => {
  it("returns 1 when all values are 0", () => {
    expect(chiSquarePValue(0, 0, 0, 0)).toBe(1);
  });

  it("returns a high p-value when groups are similar", () => {
    const p = chiSquarePValue(10, 90, 12, 88);
    expect(p).toBeGreaterThan(0.5);
  });

  it("returns a low p-value when groups are very different", () => {
    const p = chiSquarePValue(50, 50, 10, 90);
    expect(p).toBeLessThan(0.001);
  });

  it("returns 1 when no successes in either group", () => {
    const p = chiSquarePValue(0, 100, 0, 100);
    expect(p).toBe(1);
  });
});

describe("formatPValue", () => {
  it("formats values below 0.001 as <0.001", () => {
    expect(formatPValue(0.0005)).toBe("<0.001");
  });

  it("formats normal values to 3 decimal places", () => {
    expect(formatPValue(0.05)).toBe("0.050");
  });
});

describe("isSignificant", () => {
  it("returns true for p-value below 0.05", () => {
    expect(isSignificant(0.03)).toBe(true);
  });

  it("returns false for p-value above 0.05", () => {
    expect(isSignificant(0.07)).toBe(false);
  });
});
