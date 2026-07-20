import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const VIEWPORT_WIDTH = parseInt(process.env.VIEWPORT_WIDTH || "320", 10);

const PAGES = [
  { path: "/", name: "Home" },
  { path: "/about", name: "About" },
  { path: "/blog", name: "Blog" },
  { path: "/contact", name: "Contact" },
  { path: "/portfolio", name: "Portfolio" },
  { path: "/resume", name: "Resume" },
  { path: "/services", name: "Services" },
  { path: "/search", name: "Search" },
  { path: "/testimonials", name: "Testimonials" },
  { path: "/privacy", name: "Privacy" },
  { path: "/terms", name: "Terms" },
  { path: "/cookies", name: "Cookies" },
  { path: "/book-consultation", name: "Book Consultation" },
];

async function auditOverflow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: Math.round(VIEWPORT_WIDTH * 2.16) },
    deviceScaleFactor: 2,
  });

  const results = [];

  for (const page of PAGES) {
    const pageObj = await context.newPage();
    let overflow = false;
    let overflowWidth = 0;

    try {
      await pageObj.goto(`${BASE_URL}${page.path}`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });
      await pageObj.waitForTimeout(2000);

      // Check horizontal overflow
      const overflowInfo = await pageObj.evaluate(() => {
        const bodyWidth = document.body.scrollWidth;
        const viewportWidth = window.innerWidth;
        const hasOverflow = bodyWidth > viewportWidth + 1; // 1px tolerance

        // Find elements causing overflow
        const allElements = document.querySelectorAll("*");
        const overflowing = [];

        for (const el of allElements) {
          if (el === document.body || el === document.documentElement) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0) continue;
          const rightEdge = rect.right;
          if (rightEdge > viewportWidth + 1 && rightEdge < 9999) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls = Array.from(el.classList).slice(0, 3).join(".");
            const text =
              (el.textContent || "").trim().slice(0, 60) || "(no text)";
            overflowing.push({
              element: `${tag}${id}${cls ? `.${cls}` : ""}`,
              width: rect.width,
              rightEdge: Math.round(rightEdge),
              viewportWidth,
              text: text,
              tag: tag,
            });
          }
        }

        // Also check html element
        const htmlScroll = document.documentElement.scrollWidth;
        const htmlClient = document.documentElement.clientWidth;

        return {
          hasOverflow: hasOverflow,
          bodyScrollWidth: bodyWidth,
          viewportWidth: viewportWidth,
          overflowWidth: bodyWidth - viewportWidth,
          htmlScrollWidth: htmlScroll,
          htmlClientWidth: htmlClient,
          overflowingElements: overflowing.slice(0, 15),
        };
      });

      if (overflowInfo.hasOverflow) {
        overflow = true;
        overflowWidth = overflowInfo.overflowWidth;
        await pageObj.screenshot({
          path: `/tmp/overflow-${page.path.replace(/\//g, "-") || "home"}.png`,
          fullPage: true,
        });
      }

      results.push({
        name: page.name,
        path: page.path,
        overflow,
        overflowWidth: Math.round(overflowWidth),
        bodyScrollWidth: overflowInfo.bodyScrollWidth,
        viewportWidth: overflowInfo.viewportWidth,
        elementWarnings: overflowInfo.overflowingElements,
      });
    } catch (err) {
      results.push({
        name: page.name,
        path: page.path,
        overflow: true,
        error: err.message.slice(0, 120),
      });
    } finally {
      await pageObj.close();
    }
  }

  await context.close();
  await browser.close();

  // Report
  console.log("\n═══════════════════════════════════════════");
  console.log(`  HORIZONTAL OVERFLOW AUDIT (${VIEWPORT_WIDTH}px viewport)`);
  console.log("═══════════════════════════════════════════\n");

  const failing = results.filter((r) => r.overflow);
  const passing = results.filter((r) => !r.overflow);

  console.log(`  ✅ No overflow: ${passing.length}  ⚠️  Overflow found: ${failing.length}  Total: ${results.length}\n`);

  // Pages with actual body overflow (scrollbar appears)
  if (failing.length > 0) {
    console.log("  ─── PAGES WITH HORIZONTAL OVERFLOW ───\n");
    for (const r of failing) {
      console.log(`  ❌ ${r.name} (${r.path})`);
      if (r.error) {
        console.log(`     Error: ${r.error}`);
      } else {
        console.log(`     Body scrolls ${r.overflowWidth}px beyond viewport`);
        console.log(`     Body: ${r.bodyScrollWidth}px > Viewport: ${r.viewportWidth}px`);
        console.log(`     📸 Screenshot saved to /tmp/overflow-${r.path.replace(/\//g, "-") || "home"}.png`);
      }
      console.log();
    }
  }

  // Element warnings (elements extend beyond viewport but body doesn't scroll)
  const withWarnings = results.filter((r) => r.elementWarnings?.length > 0 && !r.overflow);
  if (withWarnings.length > 0) {
    console.log("  ─── ELEMENT WARNINGS (no scrollbar — decorative/absolutely positioned) ───\n");
    for (const r of withWarnings) {
      console.log(`  ℹ️  ${r.name} (${r.path})`);
      console.log(`     Body: ${r.bodyScrollWidth}px = Viewport: ${r.viewportWidth}px (no actual overflow)`);
      for (const el of r.elementWarnings.slice(0, 3)) {
        console.log(`     • <${el.tag}> ${el.element} — right edge at ${el.rightEdge}px (w: ${el.width}px)`);
        if (el.tag === "div" && el.text === "(no text)") {
          console.log(`       (decorative element — no visible content)`);
        }
      }
      console.log();
    }
  }

  if (passing.length > 0) {
    console.log("  ─── PAGES PASSED ───\n");
    for (const r of passing) {
      if (!r.elementWarnings?.length) {
        console.log(`  ✅ ${r.name} (${r.path})`);
      }
    }
    console.log();
  }

  console.log("═══════════════════════════════════════════\n");

  process.exit(failing.length > 0 ? 1 : 0);
}

auditOverflow().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
