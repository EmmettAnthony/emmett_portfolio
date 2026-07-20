import { describe, it, expect } from "vitest";

interface ScreenshotComparison {
  name: string;
  path: string;
  viewports: Array<{ width: number; height: number; label: string }>;
  threshold: number;
}

interface ComparisonResult {
  pass: boolean;
  diffPercentage: number;
  diffPixels: number;
}

const VIEWPORTS = {
  mobile: { width: 375, height: 812, label: "mobile" },
  tablet: { width: 768, height: 1024, label: "tablet" },
  laptop: { width: 1280, height: 800, label: "laptop" },
  desktop: { width: 1920, height: 1080, label: "desktop" },
  ultrawide: { width: 3440, height: 1440, label: "ultrawide" },
};

const PAGES_TO_CAPTURE: ScreenshotComparison[] = [
  { name: "homepage", path: "/", viewports: [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop], threshold: 0.01 },
  { name: "dashboard", path: "/admin/dashboard/overview", viewports: [VIEWPORTS.desktop], threshold: 0.01 },
  { name: "invoices", path: "/admin/dashboard/invoices", viewports: [VIEWPORTS.desktop], threshold: 0.02 },
  { name: "customers", path: "/admin/dashboard/customers", viewports: [VIEWPORTS.desktop], threshold: 0.02 },
  { name: "booking", path: "/book", viewports: [VIEWPORTS.mobile, VIEWPORTS.desktop], threshold: 0.02 },
  { name: "login", path: "/admin/login", viewports: [VIEWPORTS.desktop], threshold: 0.01 },
  { name: "settings", path: "/admin/dashboard/settings", viewports: [VIEWPORTS.desktop], threshold: 0.02 },
  { name: "reports", path: "/admin/dashboard/reports", viewports: [VIEWPORTS.desktop], threshold: 0.02 },
  { name: "about", path: "/about", viewports: [VIEWPORTS.mobile, VIEWPORTS.desktop], threshold: 0.02 },
  { name: "services", path: "/services", viewports: [VIEWPORTS.mobile, VIEWPORTS.desktop], threshold: 0.02 },
];

const DARK_MODE_PAGES: ScreenshotComparison[] = [
  { name: "homepage-dark", path: "/", viewports: [VIEWPORTS.desktop], threshold: 0.01 },
  { name: "dashboard-dark", path: "/admin/dashboard/overview", viewports: [VIEWPORTS.desktop], threshold: 0.01 },
  { name: "invoices-dark", path: "/admin/dashboard/invoices", viewports: [VIEWPORTS.desktop], threshold: 0.02 },
];

function shouldCaptureOnViewport(page: ScreenshotComparison, viewportLabel: string): boolean {
  return page.viewports.some((v) => v.label === viewportLabel);
}

function getCapturePlan(): { pageCount: number; screenshotCount: number; viewportsUsed: string[] } {
  const viewportsUsed = new Set<string>();
  let screenshotCount = 0;

  for (const page of [...PAGES_TO_CAPTURE, ...DARK_MODE_PAGES]) {
    for (const vp of page.viewports) {
      viewportsUsed.add(vp.label);
      screenshotCount++;
    }
  }

  return {
    pageCount: PAGES_TO_CAPTURE.length + DARK_MODE_PAGES.length,
    screenshotCount,
    viewportsUsed: Array.from(viewportsUsed),
  };
}

describe("Visual Regression Test Plan", () => {
  describe("Viewport Coverage", () => {
    it("covers all required viewports", () => {
      const plan = getCapturePlan();
      expect(plan.viewportsUsed).toContain("mobile");
      expect(plan.viewportsUsed).toContain("tablet");
      expect(plan.viewportsUsed).toContain("desktop");
    });

    it("captures all pages on desktop", () => {
      for (const page of PAGES_TO_CAPTURE) {
        expect(shouldCaptureOnViewport(page, "desktop")).toBe(true);
      }
    });

    it("captures responsive pages on mobile", () => {
      const responsivePages = PAGES_TO_CAPTURE.filter((p) => shouldCaptureOnViewport(p, "mobile"));
      expect(responsivePages.length).toBeGreaterThan(0);
    });

    it("includes dark mode variants", () => {
      expect(DARK_MODE_PAGES.length).toBeGreaterThan(0);
    });
  });

  describe("Screenshot Configurations", () => {
    it("all thresholds are within acceptable range", () => {
      for (const page of [...PAGES_TO_CAPTURE, ...DARK_MODE_PAGES]) {
        expect(page.threshold).toBeLessThanOrEqual(0.05);
        expect(page.threshold).toBeGreaterThan(0);
      }
    });

    it("all pages have at least one viewport", () => {
      for (const page of PAGES_TO_CAPTURE) {
        expect(page.viewports.length).toBeGreaterThan(0);
      }
    });

    it("dashboard pages have stricter thresholds", () => {
      const dashboardPages = PAGES_TO_CAPTURE.filter(
        (p) => p.name.includes("dashboard") || p.name === "login",
      );
      for (const page of dashboardPages) {
        expect(page.threshold).toBeLessThanOrEqual(0.01);
      }
    });
  });
});
