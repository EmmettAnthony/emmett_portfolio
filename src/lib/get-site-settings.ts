import { getPrisma } from "@/lib/db";
import { siteConfig } from "@/data/site-config";

export interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export interface SiteSettingsData {
  siteName: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  logo: string;
  favicon: string;
  email: string;
  phone: string;
  address: string;
  social: Record<string, string>;
  keywords: string[];
  navigationLinks: NavLink[];
}

const defaultNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Services", href: "/services" },
  { label: "Resume", href: "/resume" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const defaultSocial: Record<string, string> = {
  github: "https://github.com/emmettanthony",
  linkedin: "https://linkedin.com/in/emmettanthony",
  twitter: "https://twitter.com/emmettanthony",
  email: "hello@emmettanthony.dev",
  whatsapp: "+1234567890",
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const prisma = getPrisma();
    const [siteSettings, seoSettings] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "global" } }),
      prisma.seoSettings.findUnique({ where: { id: "global" } }),
    ]);

    let social: Record<string, string> = defaultSocial;
    if (siteSettings?.social) {
      try {
        const parsed = JSON.parse(siteSettings.social);
        social = { ...defaultSocial, ...parsed };
      } catch {}
    }

    let navigationLinks: NavLink[] = defaultNavLinks;
    if (siteSettings?.navigationLinks) {
      try {
        const parsed = JSON.parse(siteSettings.navigationLinks) as NavLink[];
        if (Array.isArray(parsed) && parsed.length > 0) navigationLinks = parsed;
      } catch {}
    }

    return {
      siteName: siteSettings?.siteName || seoSettings?.siteName || siteConfig.name,
      tagline: siteSettings?.tagline || seoSettings?.tagline || siteConfig.tagline,
      description: seoSettings?.description || siteConfig.description,
      url: siteConfig.url,
      ogImage: seoSettings?.ogImage || siteConfig.ogImage,
      logo: siteSettings?.logo || "",
      favicon: siteSettings?.favicon || "",
      email: siteSettings?.email || siteConfig.links.email,
      phone: siteSettings?.phone || siteConfig.whatsapp,
      address: siteSettings?.address || siteConfig.location,
      social,
      navigationLinks,
      keywords: siteConfig.keywords,
    };
  } catch {
    return {
      siteName: siteConfig.name,
      tagline: siteConfig.tagline,
      description: siteConfig.description,
      url: siteConfig.url,
      ogImage: siteConfig.ogImage,
      logo: "",
      favicon: "",
      email: siteConfig.links.email,
      phone: siteConfig.whatsapp,
      address: siteConfig.location,
      social: defaultSocial,
      navigationLinks: defaultNavLinks,
      keywords: siteConfig.keywords,
    };
  }
}
