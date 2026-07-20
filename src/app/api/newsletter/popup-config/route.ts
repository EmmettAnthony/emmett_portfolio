import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Default popup config: enabled on most pages, disabled on home/resume/dashboard */
const DEFAULT_POPUP_CONFIG = {
  enabled: true,
  defaultEnabled: true,
  perPage: {
    "/": false,
    "/about": true,
    "/blog": true,
    "/contact": true,
    "/portfolio": false,
    "/services": true,
    "/testimonials": false,
    "/resume": false,
    "/book-consultation": false,
    "/search": true,
    "/privacy": false,
    "/terms": false,
    "/cookies": false,
    "/newsletter": false,
  } as Record<string, boolean>,
  /** Per-page delay overrides (ms). If not set, falls back to the component's `delay` prop. */
  perPageDelay: {
    "/services": 5000,
    "/blog": 5000,
    "/contact": 10000,
  } as Record<string, number>,
};

export type PopupConfig = typeof DEFAULT_POPUP_CONFIG;

/** GET /api/newsletter/popup-config — public, no auth required */
export async function GET() {
  try {
    const settings = await prisma.newsletterSettings.findUnique({
      where: { id: "global" },
    });

    if (!settings?.signupFormConfig) {
      return NextResponse.json(DEFAULT_POPUP_CONFIG);
    }

    const formConfig = settings.signupFormConfig as Record<string, unknown>;
    const popupConfig = formConfig.popupConfig as Partial<PopupConfig> | undefined;

    if (!popupConfig) {
      return NextResponse.json(DEFAULT_POPUP_CONFIG);
    }

    // Merge with defaults so new pages always have a setting
    const merged: PopupConfig = {
      enabled: popupConfig.enabled ?? DEFAULT_POPUP_CONFIG.enabled,
      defaultEnabled: popupConfig.defaultEnabled ?? DEFAULT_POPUP_CONFIG.defaultEnabled,
      perPage: {
        ...DEFAULT_POPUP_CONFIG.perPage,
        ...(popupConfig.perPage ?? {}),
      },
      perPageDelay: {
        ...DEFAULT_POPUP_CONFIG.perPageDelay,
        ...(popupConfig.perPageDelay ?? {}),
      },
    };

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Failed to fetch popup config:", error);
    // On error, return defaults so the popup still works
    return NextResponse.json(DEFAULT_POPUP_CONFIG);
  }
}
