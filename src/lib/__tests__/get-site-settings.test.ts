import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSiteSettingsFindUnique = vi.hoisted(() => vi.fn());
const mockSeoSettingsFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(() => ({
    siteSettings: { findUnique: mockSiteSettingsFindUnique },
    seoSettings: { findUnique: mockSeoSettingsFindUnique },
  })),
}));

vi.mock("@/data/site-config", () => ({
  siteConfig: {
    name: "Emmett Anthony",
    tagline: "Building modern, scalable, and user-focused digital solutions.",
    description: "Emmett Anthony is a software developer with over three years of experience designing, developing, and maintaining websites, web applications, and digital solutions.",
    url: "https://emmettanthony.dev",
    ogImage: "/og-image.png",
    links: {
      github: "https://github.com/emmettanthony",
      linkedin: "https://linkedin.com/in/emmettanthony",
      twitter: "https://twitter.com/emmettanthony",
      email: "hello@emmettanthony.dev",
    },
    whatsapp: "+1234567890",
    phone: "+1234567890",
    location: "San Francisco, CA",
    keywords: [
      "Software Developer",
      "Web Developer",
      "Full Stack Developer",
      "Next.js Developer",
      "WordPress Developer",
    ],
  },
}));

import { getSiteSettings } from "@/lib/get-site-settings";

const defaultSocial = {
  github: "https://github.com/emmettanthony",
  linkedin: "https://linkedin.com/in/emmettanthony",
  twitter: "https://twitter.com/emmettanthony",
  email: "hello@emmettanthony.dev",
  whatsapp: "+1234567890",
};

const defaultNavLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Services", href: "/services" },
  { label: "Resume", href: "/resume" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const siteConfigFallback = {
  name: "Emmett Anthony",
  tagline: "Building modern, scalable, and user-focused digital solutions.",
  description: "Emmett Anthony is a software developer with over three years of experience designing, developing, and maintaining websites, web applications, and digital solutions.",
  url: "https://emmettanthony.dev",
  ogImage: "/og-image.png",
  links: { email: "hello@emmettanthony.dev" },
  whatsapp: "+1234567890",
  location: "San Francisco, CA",
  keywords: ["Software Developer", "Web Developer", "Full Stack Developer", "Next.js Developer", "WordPress Developer"],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSiteSettings", () => {
  it("returns merged data from siteSettings and seoSettings when both found", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({
      siteName: "My Site",
      tagline: "My Tagline",
      logo: "/logo.png",
      favicon: "/favicon.ico",
      email: "site@example.com",
      phone: "+1111111111",
      address: "123 Main St",
      social: JSON.stringify({ twitter: "https://twitter.com/mysite" }),
      navigationLinks: JSON.stringify([{ label: "Custom", href: "/custom" }]),
    });
    mockSeoSettingsFindUnique.mockResolvedValue({
      siteName: "SEO Name",
      tagline: "SEO Tagline",
      description: "SEO Description",
      ogImage: "/seo-og.png",
    });
    const result = await getSiteSettings();
    expect(result.siteName).toBe("My Site");
    expect(result.tagline).toBe("My Tagline");
    expect(result.description).toBe("SEO Description");
    expect(result.url).toBe("https://emmettanthony.dev");
    expect(result.ogImage).toBe("/seo-og.png");
    expect(result.logo).toBe("/logo.png");
    expect(result.favicon).toBe("/favicon.ico");
    expect(result.email).toBe("site@example.com");
    expect(result.phone).toBe("+1111111111");
    expect(result.address).toBe("123 Main St");
    expect(result.social).toEqual({ ...defaultSocial, twitter: "https://twitter.com/mysite" });
    expect(result.navigationLinks).toEqual([{ label: "Custom", href: "/custom" }]);
    expect(result.keywords).toEqual(siteConfigFallback.keywords);
  });

  it("uses siteSettings values over seoSettings for overlapping fields", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({ siteName: "Site Name", tagline: "Site Tagline" });
    mockSeoSettingsFindUnique.mockResolvedValue({ siteName: "SEO Name", tagline: "SEO Tagline" });
    const result = await getSiteSettings();
    expect(result.siteName).toBe("Site Name");
    expect(result.tagline).toBe("Site Tagline");
  });

  it("uses seoSettings values when siteSettings fields are null", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({ siteName: null, tagline: null });
    mockSeoSettingsFindUnique.mockResolvedValue({ siteName: "SEO Name", tagline: "SEO Tagline" });
    const result = await getSiteSettings();
    expect(result.siteName).toBe("SEO Name");
    expect(result.tagline).toBe("SEO Tagline");
  });

  it("falls back to siteConfig defaults when both are null", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({ siteName: null, tagline: null });
    mockSeoSettingsFindUnique.mockResolvedValue({ siteName: null, tagline: null });
    const result = await getSiteSettings();
    expect(result.siteName).toBe(siteConfigFallback.name);
    expect(result.tagline).toBe(siteConfigFallback.tagline);
    expect(result.description).toBe(siteConfigFallback.description);
  });

  it("returns siteSettings.social as parsed JSON, merged with defaults", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({
      social: JSON.stringify({ github: "https://github.com/custom" }),
    });
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.social.github).toBe("https://github.com/custom");
    expect(result.social.linkedin).toBe(defaultSocial.linkedin);
    expect(result.social.email).toBe(defaultSocial.email);
  });

  it("uses defaultSocial when siteSettings.social is invalid JSON", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({ social: "{invalid json}" });
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.social).toEqual(defaultSocial);
  });

  it("returns siteSettings.navigationLinks as parsed JSON when valid array", async () => {
    const links = [{ label: "Custom", href: "/custom" }];
    mockSiteSettingsFindUnique.mockResolvedValue({
      navigationLinks: JSON.stringify(links),
    });
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.navigationLinks).toEqual(links);
  });

  it("uses defaultNavLinks when siteSettings.navigationLinks is invalid JSON", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({ navigationLinks: "{invalid json}" });
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.navigationLinks).toEqual(defaultNavLinks);
  });

  it("uses defaultNavLinks when parsed navigationLinks is not an array", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({
      navigationLinks: JSON.stringify({ label: "Not Array" }),
    });
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.navigationLinks).toEqual(defaultNavLinks);
  });

  it("uses defaultNavLinks when parsed navigationLinks is empty", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({
      navigationLinks: JSON.stringify([]),
    });
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.navigationLinks).toEqual(defaultNavLinks);
  });

  it("handles null siteSettings gracefully (uses seoSettings + defaults)", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue(null);
    mockSeoSettingsFindUnique.mockResolvedValue({
      siteName: "SEO",
      tagline: "SEO Tag",
      description: "SEO Desc",
      ogImage: "/seo-og.png",
    });
    const result = await getSiteSettings();
    expect(result.siteName).toBe("SEO");
    expect(result.tagline).toBe("SEO Tag");
    expect(result.description).toBe("SEO Desc");
    expect(result.ogImage).toBe("/seo-og.png");
    expect(result.logo).toBe("");
    expect(result.favicon).toBe("");
    expect(result.email).toBe(siteConfigFallback.links.email);
    expect(result.phone).toBe(siteConfigFallback.whatsapp);
    expect(result.address).toBe(siteConfigFallback.location);
    expect(result.social).toEqual(defaultSocial);
    expect(result.navigationLinks).toEqual(defaultNavLinks);
  });

  it("handles null seoSettings gracefully (uses siteSettings + defaults)", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({
      siteName: "Site",
      tagline: "Site Tag",
      logo: "/logo.png",
      email: "site@example.com",
    });
    mockSeoSettingsFindUnique.mockResolvedValue(null);
    const result = await getSiteSettings();
    expect(result.siteName).toBe("Site");
    expect(result.tagline).toBe("Site Tag");
    expect(result.description).toBe(siteConfigFallback.description);
    expect(result.ogImage).toBe(siteConfigFallback.ogImage);
    expect(result.logo).toBe("/logo.png");
    expect(result.favicon).toBe("");
    expect(result.email).toBe("site@example.com");
    expect(result.phone).toBe(siteConfigFallback.whatsapp);
    expect(result.address).toBe(siteConfigFallback.location);
  });

  it("returns fallback values when prisma throws error", async () => {
    mockSiteSettingsFindUnique.mockRejectedValue(new Error("DB error"));
    mockSeoSettingsFindUnique.mockRejectedValue(new Error("DB error"));
    const result = await getSiteSettings();
    expect(result.siteName).toBe(siteConfigFallback.name);
    expect(result.tagline).toBe(siteConfigFallback.tagline);
    expect(result.description).toBe(siteConfigFallback.description);
    expect(result.url).toBe(siteConfigFallback.url);
    expect(result.ogImage).toBe(siteConfigFallback.ogImage);
    expect(result.logo).toBe("");
    expect(result.favicon).toBe("");
    expect(result.email).toBe(siteConfigFallback.links.email);
    expect(result.phone).toBe(siteConfigFallback.whatsapp);
    expect(result.address).toBe(siteConfigFallback.location);
    expect(result.social).toEqual(defaultSocial);
    expect(result.navigationLinks).toEqual(defaultNavLinks);
    expect(result.keywords).toEqual(siteConfigFallback.keywords);
  });

  it("returns empty logo/favicon when not in siteSettings", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({});
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.logo).toBe("");
    expect(result.favicon).toBe("");
  });

  it("returns keywords from siteConfig", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({});
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.keywords).toEqual(siteConfigFallback.keywords);
  });

  it("handles siteSettings with social as non-string (invalid JSON path)", async () => {
    mockSiteSettingsFindUnique.mockResolvedValue({ social: 123 });
    mockSeoSettingsFindUnique.mockResolvedValue({});
    const result = await getSiteSettings();
    expect(result.social).toEqual(defaultSocial);
  });
});
