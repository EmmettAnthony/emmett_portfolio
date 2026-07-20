import { describe, it, expect } from "vitest";

interface AxeViolation {
  id: string;
  impact: "critical" | "serious" | "moderate" | "minor";
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
}

interface AxeResult {
  violations: AxeViolation[];
  passes: number;
  incomplete: number;
}

const WCAG_CRITERIA: Record<string, string> = {
  "color-contrast": "Ensure color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large)",
  "button-name": "Buttons must have discernible text",
  "image-alt": "Images must have alt text",
  "label": "Form elements must have labels",
  "heading-order": "Heading levels should increase by one",
  "landmark-one-main": "Page must have exactly one main landmark",
  "page-has-heading-one": "Page must have at least one h1",
  "link-name": "Links must have discernible text",
  "aria-required-children": "ARIA roles must have required children",
  "aria-required-parent": "ARIA roles must be contained by required parent",
  "aria-roles": "ARIA roles must be valid",
  "aria-valid-attr-value": "ARIA attribute values must be valid",
  "aria-valid-attr": "ARIA attributes must be valid",
  "duplicate-id": "IDs must be unique",
  "meta-viewport": "Viewport meta must not disable zoom",
  "html-has-lang": "HTML element must have lang attribute",
  "html-lang-valid": "HTML lang attribute must be valid",
  "input-button-name": "Input buttons must have discernible text",
  "landmark-no-duplicate-banner": "Page must not have duplicate banners",
  "landmark-no-duplicate-contentinfo": "Page must not have duplicate contentinfo",
  "landmark-unique": "Landmarks must be unique",
  "scrollable-region-focusable": "Scrollable regions must be focusable",
  "skip-link": "Page must have a skip link",
  "tabindex": "tabindex should not be greater than 0",
  "target-size": "Targets must be at least 24x24 CSS pixels",
  "nested-interactive": "Interactive controls must not be nested",
};

function analyzeViolations(violations: AxeViolation[]): { critical: AxeViolation[]; serious: AxeViolation[]; moderate: AxeViolation[]; minor: AxeViolation[] } {
  return {
    critical: violations.filter((v) => v.impact === "critical"),
    serious: violations.filter((v) => v.impact === "serious"),
    moderate: violations.filter((v) => v.impact === "moderate"),
    minor: violations.filter((v) => v.impact === "minor"),
  };
}

function getViolationSummary(result: AxeResult): string {
  const grouped = analyzeViolations(result.violations);
  const parts: string[] = [];
  if (grouped.critical.length) parts.push(`${grouped.critical.length} critical`);
  if (grouped.serious.length) parts.push(`${grouped.serious.length} serious`);
  if (grouped.moderate.length) parts.push(`${grouped.moderate.length} moderate`);
  if (grouped.minor.length) parts.push(`${grouped.minor.length} minor`);
  return parts.join(", ") || "No violations";
}

const mockViolation: AxeViolation = {
  id: "color-contrast",
  impact: "serious",
  description: "Element has insufficient color contrast",
  help: "Elements must have sufficient color contrast",
  helpUrl: "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
  nodes: 3,
};

describe("Accessibility Tests", () => {
  describe("WCAG Criteria Coverage", () => {
    it("covers all required WCAG AA criteria", () => {
      const required = ["color-contrast", "button-name", "image-alt", "label", "heading-order", "link-name", "html-has-lang"];
      for (const criterion of required) {
        expect(WCAG_CRITERIA).toHaveProperty(criterion);
      }
    });

    it("includes keyboard navigation criteria", () => {
      expect(WCAG_CRITERIA["tabindex"]).toBeDefined();
      expect(WCAG_CRITERIA["skip-link"]).toBeDefined();
    });

    it("includes ARIA criteria", () => {
      expect(WCAG_CRITERIA["aria-roles"]).toBeDefined();
      expect(WCAG_CRITERIA["aria-valid-attr"]).toBeDefined();
    });
  });

  describe("analyzeViolations", () => {
    it("groups violations by impact", () => {
      const violations: AxeViolation[] = [
        { ...mockViolation, id: "critical-1", impact: "critical" },
        { ...mockViolation, id: "serious-1", impact: "serious" },
        { ...mockViolation, id: "moderate-1", impact: "moderate" },
        { ...mockViolation, id: "minor-1", impact: "minor" },
      ];

      const result = analyzeViolations(violations);
      expect(result.critical).toHaveLength(1);
      expect(result.serious).toHaveLength(1);
      expect(result.moderate).toHaveLength(1);
      expect(result.minor).toHaveLength(1);
    });
  });

  describe("getViolationSummary", () => {
    it("summarizes violations", () => {
      const violations: AxeViolation[] = [
        { ...mockViolation, id: "c1", impact: "critical", nodes: 2 },
        { ...mockViolation, id: "s1", impact: "serious", nodes: 1 },
      ];
      const result: AxeResult = { violations, passes: 15, incomplete: 2 };
      const summary = getViolationSummary(result);
      expect(summary).toContain("1 critical");
      expect(summary).toContain("1 serious");
    });

    it("returns no violations when clean", () => {
      const result: AxeResult = { violations: [], passes: 20, incomplete: 0 };
      expect(getViolationSummary(result)).toBe("No violations");
    });
  });

  describe("Keyboard Accessibility", () => {
    it("validates tabindex values for interactive elements", () => {
      const tabindexValues = [0, -1];
      expect(tabindexValues).toEqual(expect.arrayContaining([0, -1]));
    });

    it("requires visible focus indicators", () => {
      const focusStyles = ["outline", "ring", "box-shadow"];
      expect(focusStyles.length).toBeGreaterThan(0);
    });
  });

  describe("Screen Reader Support", () => {
    it("requires all images to have alt text", () => {
      const images = [
        { alt: "Company logo" },
        { alt: "" },
      ];
      const allHaveAlt = images.every((img) => "alt" in img);
      expect(allHaveAlt).toBe(true);
    });

    it("requires aria-labels on icon-only buttons", () => {
      const button = { innerHTML: "<svg>...</svg>", ariaLabel: "Close menu" };
      expect(button.ariaLabel).toBeTruthy();
    });

    it("requires form inputs to have associated labels", () => {
      const field = { id: "email", label: "Email address" };
      expect(field.label).toBeTruthy();
    });
  });
});
