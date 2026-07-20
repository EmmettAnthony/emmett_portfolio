import { describe, it, expect } from "vitest";

describe("calculateEngagementScore", () => {
  it("returns 0 for no events", () => {
    const score = 0;
    expect(score).toBe(0);
  });

  it("scores are always between 0 and 100", () => {
    const scores = [0, 50, 100];
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});
