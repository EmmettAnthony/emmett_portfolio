import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = "public";

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });

  try {
    // Mobile screenshot (narrow form_factor)
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({
      path: `${OUTPUT_DIR}/pwa-screenshot-mobile.png`,
      fullPage: false,
    });
    console.log("✅ Mobile screenshot saved to public/pwa-screenshot-mobile.png");
    await mobileContext.close();

    // Desktop screenshot (wide form_factor)
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(BASE_URL, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(3000);
    await desktopPage.screenshot({
      path: `${OUTPUT_DIR}/pwa-screenshot-desktop.png`,
      fullPage: true,
    });
    console.log("✅ Desktop screenshot saved to public/pwa-screenshot-desktop.png");
    await desktopContext.close();
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch((err) => {
  console.error("❌ Failed to capture screenshots:", err);
  process.exit(1);
});
