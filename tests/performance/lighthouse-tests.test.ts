import { describe, it, expect } from "vitest";

interface LighthouseResult {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  lcp: number;
  inp: number;
  cls: number;
  fcp: number;
  tti: number;
  tbt: number;
}

interface PerformanceBudget {
  lcpMaxMs: number;
  inpMaxMs: number;
  clsMax: number;
  fcpMaxMs: number;
  ttiMaxMs: number;
  tbtMaxMs: number;
  performanceMin: number;
  accessibilityMin: number;
}

const DEFAULT_BUDGET: PerformanceBudget = {
  lcpMaxMs: 2500,
  inpMaxMs: 200,
  clsMax: 0.1,
  fcpMaxMs: 1800,
  ttiMaxMs: 3000,
  tbtMaxMs: 300,
  performanceMin: 90,
  accessibilityMin: 95,
};

function checkLighthouseBudget(result: LighthouseResult, budget: PerformanceBudget = DEFAULT_BUDGET): { pass: boolean; failures: string[] } {
  const failures: string[] = [];

  if (result.lcp > budget.lcpMaxMs) failures.push(`LCP ${result.lcp}ms exceeds budget ${budget.lcpMaxMs}ms`);
  if (result.inp > budget.inpMaxMs) failures.push(`INP ${result.inp}ms exceeds budget ${budget.inpMaxMs}ms`);
  if (result.cls > budget.clsMax) failures.push(`CLS ${result.cls} exceeds budget ${budget.clsMax}`);
  if (result.fcp > budget.fcpMaxMs) failures.push(`FCP ${result.fcp}ms exceeds budget ${budget.fcpMaxMs}ms`);
  if (result.tti > budget.ttiMaxMs) failures.push(`TTI ${result.tti}ms exceeds budget ${budget.ttiMaxMs}ms`);
  if (result.tbt > budget.tbtMaxMs) failures.push(`TBT ${result.tbt}ms exceeds budget ${budget.tbtMaxMs}ms`);
  if (result.performance < budget.performanceMin) failures.push(`Performance ${result.performance}% below ${budget.performanceMin}%`);
  if (result.accessibility < budget.accessibilityMin) failures.push(`Accessibility ${result.accessibility}% below ${budget.accessibilityMin}%`);

  return { pass: failures.length === 0, failures };
}

function estimateApiResponseTime(samples: number[]): { avg: number; p95: number; max: number } {
  const sorted = [...samples].sort((a, b) => a - b);
  const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
  const p95Index = Math.ceil(sorted.length * 0.95) - 1;
  return {
    avg: Math.round(avg),
    p95: sorted[p95Index],
    max: sorted[sorted.length - 1],
  };
}

describe("Performance Tests", () => {
  describe("Lighthouse Budget", () => {
    it("passes with good metrics", () => {
      const result: LighthouseResult = {
        performance: 95, accessibility: 98, bestPractices: 100, seo: 100,
        lcp: 1800, inp: 100, cls: 0.05, fcp: 1200, tti: 2000, tbt: 150,
      };
      expect(checkLighthouseBudget(result).pass).toBe(true);
    });

    it("fails when LCP exceeds budget", () => {
      const result: LighthouseResult = {
        performance: 90, accessibility: 95, bestPractices: 100, seo: 100,
        lcp: 5000, inp: 100, cls: 0.05, fcp: 1200, tti: 2000, tbt: 150,
      };
      const check = checkLighthouseBudget(result);
      expect(check.pass).toBe(false);
      expect(check.failures[0]).toContain("LCP");
    });

    it("fails when CLS exceeds budget", () => {
      const result: LighthouseResult = {
        performance: 60, accessibility: 90, bestPractices: 90, seo: 90,
        lcp: 2000, inp: 150, cls: 0.5, fcp: 1500, tti: 2500, tbt: 200,
      };
      const check = checkLighthouseBudget(result);
      expect(check.pass).toBe(false);
      expect(check.failures.some((f) => f.includes("CLS"))).toBe(true);
    });

    it("fails when performance score is too low", () => {
      const result: LighthouseResult = {
        performance: 50, accessibility: 95, bestPractices: 90, seo: 90,
        lcp: 2000, inp: 100, cls: 0.05, fcp: 1200, tti: 2000, tbt: 150,
      };
      const check = checkLighthouseBudget(result);
      expect(check.pass).toBe(false);
      expect(check.failures.some((f) => f.includes("Performance"))).toBe(true);
    });
  });

  describe("API Response Time", () => {
    it("calculates metrics from samples", () => {
      const samples = [50, 60, 55, 200, 45, 70, 65, 300, 80, 55, 90, 75, 60, 85, 95, 100, 110, 120, 130, 140];
      const metrics = estimateApiResponseTime(samples);
      expect(metrics.avg).toBeGreaterThan(0);
      expect(metrics.p95).toBeGreaterThanOrEqual(metrics.avg);
      expect(metrics.max).toBeGreaterThanOrEqual(metrics.p95);
    });

    it("handles single sample", () => {
      const metrics = estimateApiResponseTime([100]);
      expect(metrics.avg).toBe(100);
      expect(metrics.p95).toBe(100);
      expect(metrics.max).toBe(100);
    });
  });
});
