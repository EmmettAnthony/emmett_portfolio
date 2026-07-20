import { getPrisma } from "@/lib/db";

export interface TestimonialPageSettings {
  pageShowSingleFeatured: boolean;
  pageShowCarousel: boolean;
  pageShowGrid: boolean;
  pageShowMasonry: boolean;
  pageGridColumns: 2 | 3 | 4;
}

export async function getTestimonialPageSettings(): Promise<TestimonialPageSettings> {
  try {
    const prisma = getPrisma();
    const site = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    if (!site?.integrations) {
      return { pageShowSingleFeatured: true, pageShowCarousel: true, pageShowGrid: true, pageShowMasonry: true, pageGridColumns: 3 };
    }
    const parsed = typeof site.integrations === "string" ? JSON.parse(site.integrations) : site.integrations;
    const t = parsed.testimonials || {};
    return {
      pageShowSingleFeatured: t.pageShowSingleFeatured !== false,
      pageShowCarousel: t.pageShowCarousel !== false,
      pageShowGrid: t.pageShowGrid !== false,
      pageShowMasonry: t.pageShowMasonry !== false,
      pageGridColumns: [2, 3, 4].includes(t.pageGridColumns) ? t.pageGridColumns : 3,
    };
  } catch (e) {
    console.error("Failed to load testimonial page settings:", e);
    return { pageShowSingleFeatured: true, pageShowCarousel: true, pageShowGrid: true, pageShowMasonry: true, pageGridColumns: 3 };
  }
}
