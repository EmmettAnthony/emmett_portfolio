import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  getPrisma: () => ({
    siteSettings: { findUnique: mockFindUnique },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getTestimonialPageSettings", () => {
  it("returns defaults when no site settings found", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockResolvedValue(null);

    const result = await getTestimonialPageSettings();

    expect(result).toEqual({
      pageShowSingleFeatured: true,
      pageShowCarousel: true,
      pageShowGrid: true,
      pageShowMasonry: true,
      pageGridColumns: 3,
    });
  });

  it("returns defaults when site exists but integrations is null", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockResolvedValue({ id: "global", integrations: null });

    const result = await getTestimonialPageSettings();

    expect(result.pageGridColumns).toBe(3);
    expect(result.pageShowSingleFeatured).toBe(true);
  });

  it("parses integrations when stored as JSON string", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockResolvedValue({
      id: "global",
      integrations: JSON.stringify({
        testimonials: {
          pageShowSingleFeatured: false,
          pageShowCarousel: false,
          pageGridColumns: 2,
        },
      }),
    });

    const result = await getTestimonialPageSettings();

    expect(result.pageShowSingleFeatured).toBe(false);
    expect(result.pageShowCarousel).toBe(false);
    expect(result.pageShowGrid).toBe(true);
    expect(result.pageShowMasonry).toBe(true);
    expect(result.pageGridColumns).toBe(2);
  });

  it("uses integrations object directly when already parsed", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockResolvedValue({
      id: "global",
      integrations: {
        testimonials: {
          pageShowSingleFeatured: false,
          pageShowMasonry: false,
          pageGridColumns: 4,
        },
      },
    });

    const result = await getTestimonialPageSettings();

    expect(result.pageShowSingleFeatured).toBe(false);
    expect(result.pageShowMasonry).toBe(false);
    expect(result.pageGridColumns).toBe(4);
    expect(result.pageShowCarousel).toBe(true);
    expect(result.pageShowGrid).toBe(true);
  });

  it("falls back to default pageGridColumns for invalid values", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockResolvedValue({
      id: "global",
      integrations: {
        testimonials: {
          pageGridColumns: 5,
        },
      },
    });

    const result = await getTestimonialPageSettings();

    expect(result.pageGridColumns).toBe(3);
  });

  it("falls back to default pageGridColumns for 1 (not in allowed list)", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockResolvedValue({
      id: "global",
      integrations: {
        testimonials: {
          pageGridColumns: 1,
        },
      },
    });

    const result = await getTestimonialPageSettings();

    expect(result.pageGridColumns).toBe(3);
  });

  it("accepts pageGridColumns of 2, 3, or 4", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    for (const cols of [2, 3, 4]) {
      mockFindUnique.mockResolvedValue({
        id: "global",
        integrations: {
          testimonials: { pageGridColumns: cols },
        },
      });

      const result = await getTestimonialPageSettings();
      expect(result.pageGridColumns).toBe(cols);
    }
  });

  it("returns defaults when testimonials config is missing from integrations", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockResolvedValue({
      id: "global",
      integrations: {
        otherSettings: { key: "val" },
      },
    });

    const result = await getTestimonialPageSettings();

    expect(result.pageShowSingleFeatured).toBe(true);
    expect(result.pageShowCarousel).toBe(true);
    expect(result.pageShowGrid).toBe(true);
    expect(result.pageShowMasonry).toBe(true);
    expect(result.pageGridColumns).toBe(3);
  });

  it("returns defaults on prisma error", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockRejectedValue(new Error("DB error"));

    const result = await getTestimonialPageSettings();

    expect(result).toEqual({
      pageShowSingleFeatured: true,
      pageShowCarousel: true,
      pageShowGrid: true,
      pageShowMasonry: true,
      pageGridColumns: 3,
    });
  });

  it("returns defaults on JSON parse error", async () => {
    const { getTestimonialPageSettings } = await import("../helpers/testimonial-settings");
    mockFindUnique.mockResolvedValue({
      id: "global",
      integrations: "invalid json{{{",
    });

    const result = await getTestimonialPageSettings();

    expect(result).toEqual({
      pageShowSingleFeatured: true,
      pageShowCarousel: true,
      pageShowGrid: true,
      pageShowMasonry: true,
      pageGridColumns: 3,
    });
  });
});
