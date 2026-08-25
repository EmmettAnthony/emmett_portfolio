/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

/**
 * Load axe-core source from node_modules and inject it into the page.
 * This avoids CDN dependency (which fails in headless / CI environments).
 */
const axeSource = fs.readFileSync(
  path.resolve("node_modules/axe-core/axe.min.js"),
  "utf-8"
);

async function runAxe(page: import("@playwright/test").Page) {
  await page.addScriptTag({ content: axeSource });
  await page.waitForFunction(() => typeof (window as any).axe !== "undefined");

  const results = await page.evaluate(async () => {
    const axe = (window as any).axe;
    return axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
      },
    });
  });

  return results;
}

function formatViolations(violations: any[]): string {
  if (violations.length === 0) return "No violations found";
  return violations
    .map((v) => {
      const nodes = v.nodes
        .slice(0, 3)
        .map((n: any) => `    - ${n.html.substring(0, 120)}`)
        .join("\n");
      return `[${v.impact}] ${v.id}: ${v.help} (${v.helpUrl})\n${nodes}`;
    })
    .join("\n\n");
}

const pages = [
  // Core public pages
  { path: "/", name: "Home" },
  { path: "/about", name: "About" },
  { path: "/portfolio", name: "Portfolio" },
  { path: "/contact", name: "Contact" },
  { path: "/blog", name: "Blog" },
  { path: "/resume", name: "Resume" },
  // Support pages
  { path: "/support", name: "Support" },
  { path: "/support/knowledge-base", name: "Knowledge Base" },
  { path: "/support/ticket", name: "Ticket Lookup" },
  // Resume sub-pages
  { path: "/resume/print", name: "Resume Print" },
];

test.describe("Accessibility - WCAG Compliance @a11y", () => {
  for (const { path: pagePath, name } of pages) {
    test(`${name} page (${pagePath}) has no critical or serious a11y violations`, async ({
      page,
    }) => {
      const response = await page.goto(pagePath, {
        waitUntil: "networkidle",
      });

      // Some pages may return non-200 when database is unavailable,
      // but should still render without critical a11y violations
      expect(
        response?.status(),
        `${pagePath} should return a valid HTTP response`
      ).toBeLessThan(500);

      // Give the page time to fully hydrate
      await page.waitForLoadState("networkidle");

      const results = await runAxe(page);

      // Filter to only critical and serious violations
      const criticalViolations = results.violations.filter(
        (v: any) => v.impact === "critical" || v.impact === "serious"
      );

      if (criticalViolations.length > 0) {
        console.error(
          `\n♿ Accessibility violations on ${name} (${pagePath}):\n\n${formatViolations(criticalViolations)}`
        );
      }

      expect(
        criticalViolations.length,
        `Expected no critical/serious a11y violations on ${name} page, but found ${criticalViolations.length}:\n${formatViolations(criticalViolations)}`
      ).toBe(0);
    });
  }

  test("home page has proper document structure", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Check for html lang attribute
    const lang = await page.getAttribute("html", "lang");
    expect(lang, "HTML element should have a lang attribute").toBeTruthy();

    // Check for page title
    const title = await page.title();
    expect(title, "Page should have a title").toBeTruthy();
  });

  test("home page has no empty interactive elements", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForLoadState("networkidle");

    const results = await runAxe(page);

    // Check for button-name and link-name violations specifically
    const interactiveViolations = results.violations.filter(
      (v: any) =>
        v.id === "button-name" ||
        v.id === "link-name" ||
        v.id === "input-button-name"
    );

    if (interactiveViolations.length > 0) {
      console.error(
        `\n♿ Interactive element violations:\n\n${formatViolations(interactiveViolations)}`
      );
    }

    expect(
      interactiveViolations.length,
      `Found ${interactiveViolations.length} interactive element violations`
    ).toBe(0);
  });
});
