import { describe, it, expect } from "vitest";

describe("chiSquarePValue", () => {
  it("returns 1 when all values are 0", async () => {
    const { chiSquarePValue } = await import("../stats");
    expect(chiSquarePValue(0, 0, 0, 0)).toBe(1);
  });

  it("returns 1 when row1 is 0", async () => {
    const { chiSquarePValue } = await import("../stats");
    expect(chiSquarePValue(0, 0, 10, 90)).toBe(1);
  });

  it("returns 1 when row2 is 0", async () => {
    const { chiSquarePValue } = await import("../stats");
    expect(chiSquarePValue(10, 90, 0, 0)).toBe(1);
  });

  it("returns 1 when col1 is 0", async () => {
    const { chiSquarePValue } = await import("../stats");
    expect(chiSquarePValue(0, 100, 0, 100)).toBe(1);
  });

  it("returns 1 when col2 is 0", async () => {
    const { chiSquarePValue } = await import("../stats");
    expect(chiSquarePValue(100, 0, 100, 0)).toBe(1);
  });

  it("returns a high p-value when groups are similar", async () => {
    const { chiSquarePValue } = await import("../stats");
    const p = chiSquarePValue(10, 90, 12, 88);
    expect(p).toBeGreaterThan(0.5);
  });

  it("returns a low p-value when groups are very different", async () => {
    const { chiSquarePValue } = await import("../stats");
    const p = chiSquarePValue(50, 50, 10, 90);
    expect(p).toBeLessThan(0.001);
  });

  it("returns 1 with only zeros in one cell", async () => {
    const { chiSquarePValue } = await import("../stats");
    const p = chiSquarePValue(0, 100, 0, 100);
    expect(p).toBe(1);
  });

  it("handles small sample sizes", async () => {
    const { chiSquarePValue } = await import("../stats");
    const p = chiSquarePValue(1, 2, 3, 4);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it("handles large sample sizes", async () => {
    const { chiSquarePValue } = await import("../stats");
    const p = chiSquarePValue(500, 500, 100, 900);
    expect(p).toBeLessThan(0.001);
  });

  it("returns p-value between 0 and 1", async () => {
    const { chiSquarePValue } = await import("../stats");
    const tables = [
      [10, 90, 12, 88],
      [50, 50, 10, 90],
      [30, 70, 25, 75],
      [5, 95, 15, 85],
      [100, 0, 0, 100],
    ];
    for (const [a, b, c, d] of tables) {
      const p = chiSquarePValue(a, b, c, d);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("handles identical groups giving high p-value", async () => {
    const { chiSquarePValue } = await import("../stats");
    const p = chiSquarePValue(25, 75, 25, 75);
    expect(p).toBeGreaterThan(0.9);
  });
});

describe("formatPValue", () => {
  it("returns <0.001 for values below 0.001", async () => {
    const { formatPValue } = await import("../stats");
    expect(formatPValue(0.0005)).toBe("<0.001");
    expect(formatPValue(0.0000001)).toBe("<0.001");
    expect(formatPValue(0.000999)).toBe("<0.001");
  });

  it("formats normal values to 3 decimal places", async () => {
    const { formatPValue } = await import("../stats");
    expect(formatPValue(0.05)).toBe("0.050");
    expect(formatPValue(0.1234)).toBe("0.123");
    expect(formatPValue(0.9999)).toBe("1.000");
  });

  it("formats 0 to <0.001 since 0 < 0.001", async () => {
    const { formatPValue } = await import("../stats");
    expect(formatPValue(0)).toBe("<0.001");
  });

  it("formats 0.001 as 0.001 (not <0.001)", async () => {
    const { formatPValue } = await import("../stats");
    expect(formatPValue(0.001)).toBe("0.001");
  });

  it("formats 1 as 1.000", async () => {
    const { formatPValue } = await import("../stats");
    expect(formatPValue(1)).toBe("1.000");
  });

  it("formats exactly 0.001 boundary correctly", async () => {
    const { formatPValue } = await import("../stats");
    expect(formatPValue(0.001)).toBe("0.001");
    expect(formatPValue(0.0009999)).toBe("<0.001");
  });
});

describe("isSignificant", () => {
  it("returns true for p-value below default alpha of 0.05", async () => {
    const { isSignificant } = await import("../stats");
    expect(isSignificant(0.03)).toBe(true);
    expect(isSignificant(0.049)).toBe(true);
  });

  it("returns false for p-value above 0.05", async () => {
    const { isSignificant } = await import("../stats");
    expect(isSignificant(0.07)).toBe(false);
    expect(isSignificant(0.051)).toBe(false);
  });

  it("returns false for p-value exactly at alpha boundary", async () => {
    const { isSignificant } = await import("../stats");
    expect(isSignificant(0.05)).toBe(false);
    expect(isSignificant(0.01, 0.01)).toBe(false);
  });

  it("uses custom alpha", async () => {
    const { isSignificant } = await import("../stats");
    expect(isSignificant(0.03, 0.01)).toBe(false);
    expect(isSignificant(0.03, 0.05)).toBe(true);
  });

  it("handles alpha of 0 (nothing is significant)", async () => {
    const { isSignificant } = await import("../stats");
    expect(isSignificant(0, 0)).toBe(false);
    expect(isSignificant(0.0001, 0)).toBe(false);
  });

  it("handles alpha of 1 (everything is significant)", async () => {
    const { isSignificant } = await import("../stats");
    expect(isSignificant(0.999, 1)).toBe(true);
  });
});
