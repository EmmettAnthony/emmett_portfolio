import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const PAGES = [
  { path: "/", name: "Home", section: "hero" },
  { path: "/services", name: "Services", section: "hero" },
  { path: "/testimonials", name: "Testimonials", section: "hero" },
  { path: "/privacy", name: "Privacy", section: "header" },
  { path: "/terms", name: "Terms", section: "header" },
  { path: "/cookies", name: "Cookies", section: "header" },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });

  for (const page of PAGES) {
    const pageObj = await context.newPage();
    try {
      await pageObj.goto(`${BASE_URL}${page.path}`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });
      await pageObj.waitForTimeout(2000);

      // Take screenshot of just the hero/header area (first 600px vertically)
      const clip = await pageObj.evaluate(() => {
        const hero = document.querySelector("section") || document.querySelector("main");
        if (hero) {
          const rect = hero.getBoundingClientRect();
          return { x: 0, y: 0, width: 375, height: Math.min(600, rect.height) };
        }
        return { x: 0, y: 0, width: 375, height: 400 };
      });

      await pageObj.screenshot({
        path: `/tmp/glow-${page.path.replace(/\//g, "-") || "home"}.png`,
        clip,
      });

      // Measure glow blob sizes
      const blobInfo = await pageObj.evaluate(() => {
        const allDivs = document.querySelectorAll("div");
        const blobs = [];
        for (const div of allDivs) {
          const cls = div.className;
          // Look for blur circles (rounded-full with blur effect)
          if (
            cls.includes("rounded-full") &&
            (cls.includes("blur-") || cls.includes("blur\\["))
          ) {
            const rect = div.getBoundingClientRect();
            blobs.push({
              className: cls.slice(0, 120),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              left: Math.round(rect.left),
              top: Math.round(rect.top),
              right: Math.round(rect.right),
              bottom: Math.round(rect.bottom),
              visible: rect.width > 0 && rect.height > 0,
            });
          }
        }
        return blobs;
      });

      console.log(`\n── ${page.name} (${page.path}) ──`);
      console.log(`  Screenshot: /tmp/glow-${page.path.replace(/\//g, "-") || "home"}.png`);

      if (blobInfo.length === 0) {
        console.log(`  ⚠️  No blur circle blobs detected via className check`);

        // Fallback: find ANY absolute positioned glowing/blur elements
        const fallbackInfo = await pageObj.evaluate(() => {
          const all = document.querySelectorAll("div");
          const candidates = [];
          for (const el of all) {
            const cls = el.className;
            // ANY div with h-[...] w-[...] and blur in className = glow blob
            if (cls.includes("h-[500") || cls.includes("h-[400") || cls.includes("h-[200") || cls.includes("h-[150")) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0) {
                candidates.push({
                  className: cls.slice(0, 100),
                  size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
                  pos: `(${Math.round(rect.left)}, ${Math.round(rect.top)})`,
                  rightEdge: Math.round(rect.right),
                });
              }
            }
          }
          return candidates;
        });

        if (fallbackInfo.length > 0) {
          for (const fb of fallbackInfo) {
            const warning = fb.rightEdge > 375 ? `⚠️  past viewport (ends at ${fb.rightEdge}px)` : `✅ within viewport`;
            console.log(`  ✅ Found: ${fb.size} at ${fb.pos} — ${warning}`);
            console.log(`     Class: ${fb.className}`);
          }
        } else {
          console.log(`  ℹ️  No glow blobs detected`);
        }

        // Also check hero-glow CSS classes
        const heroGlow = await pageObj.evaluate(() => {
          const el = document.querySelector(".hero-glow-blue-purple-pink, .hero-glow-amber");
          if (el) {
            const rect = el.getBoundingClientRect();
            return { className: el.className, width: Math.round(rect.width), height: Math.round(rect.height), visible: rect.width > 0 };
          }
          return null;
        });
        if (heroGlow) {
          console.log(`  ✅ Hero-glow CSS class found: ${heroGlow.className}`);
          console.log(`     Size: ${heroGlow.width}x${heroGlow.height}, Visible: ${heroGlow.visible}`);
        }
      }
    } catch (err) {
      console.log(`\n── ${page.name} (${page.path}) ──`);
      console.log(`  ❌ Error: ${err.message.slice(0, 100)}`);
    } finally {
      await pageObj.close();
    }
  }

  await context.close();
  await browser.close();

  console.log("\n═══════════════════════════════════════════");
  console.log("  Screenshots saved to /tmp/glow-*.png");
  console.log("  Open them to visually inspect the glow blobs.");
  console.log("═══════════════════════════════════════════\n");
}

capture().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
