import { z } from "zod";

// ─── Homepage (Singleton) ────────────────────────────────────────────────────

export const homepageSchema = z.object({
  // Hero Section
  heroHeadline: z.string().min(1, "Headline is required"),
  heroHighlight: z.string().nullable().optional(),
  heroSubheadline: z.string().nullable().optional(),
  heroDescription: z.string().nullable().optional(),
  heroImage: z.string().nullable().optional(),
  heroBackground: z.string().nullable().optional(),
  heroPrimaryCta: z.string().default("Hire Me"),
  heroPrimaryLink: z.string().default("/contact"),
  heroSecondaryCta: z.string().default("View Portfolio"),
  heroSecondaryLink: z.string().default("/portfolio"),
  heroResumeCta: z.string().nullable().optional(),
  heroResumeLink: z.string().nullable().optional(),

  // Statistics
  statsTitle: z.string().nullable().optional(),
  statsSubtitle: z.string().nullable().optional(),
  statsEnabled: z.boolean().default(true),

  // Why Choose Me
  whyChooseTitle: z.string().nullable().optional(),
  whyChooseSubtitle: z.string().nullable().optional(),
  whyChooseItems: z.array(z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    icon: z.string().optional(),
  })).default([]),

  // Work Process
  processTitle: z.string().nullable().optional(),
  processSubtitle: z.string().nullable().optional(),
  processSteps: z.array(z.object({
    step: z.number(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    icon: z.string().optional(),
  })).default([]),

  // Featured Projects
  projectsTitle: z.string().nullable().optional(),
  projectsSubtitle: z.string().nullable().optional(),
  projectsEnabled: z.boolean().default(true),
  projectsCount: z.number().default(6),
  layout: z.enum(["grid", "carousel", "masonry"]).default("grid"),

  // Testimonials
  testimonialsTitle: z.string().nullable().optional(),
  testimonialsSubtitle: z.string().nullable().optional(),
  testimonialsEnabled: z.boolean().default(true),
  testimonialsCount: z.number().default(6),
  testimonialLayout: z.enum(["carousel", "grid", "slider"]).default("grid"),

  // Services
  servicesTitle: z.string().nullable().optional(),
  servicesSubtitle: z.string().nullable().optional(),

  // Blog
  blogTitle: z.string().nullable().optional(),
  blogSubtitle: z.string().nullable().optional(),
  blogEnabled: z.boolean().default(true),
  blogCount: z.number().default(3),

  // Certifications & Achievements
  certTitle: z.string().nullable().optional(),
  certSubtitle: z.string().nullable().optional(),
  certEnabled: z.boolean().default(true),

  // FAQ
  faqTitle: z.string().nullable().optional(),
  faqSubtitle: z.string().nullable().optional(),
  faqs: z.array(z.object({
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required"),
  })).default([]),
  faqEnabled: z.boolean().default(true),

  // Newsletter
  newsletterTitle: z.string().nullable().optional(),
  newsletterDesc: z.string().nullable().optional(),
  newsletterEnabled: z.boolean().default(true),

  // CTA
  ctaTitle: z.string().nullable().optional(),
  ctaDescription: z.string().nullable().optional(),
  ctaBackground: z.string().nullable().optional(),
  ctaPrimaryButton: z.string().default("Get in Touch"),
  ctaPrimaryLink: z.string().default("/contact"),
  ctaSecondaryButton: z.string().nullable().optional(),
  ctaSecondaryLink: z.string().nullable().optional(),
  ctaEnabled: z.boolean().default(true),

  // SEO
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  metaKeywords: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),

  // Settings
  published: z.boolean().default(true),
});

export type HomepageFormData = z.infer<typeof homepageSchema>;

// ─── Trusted Logos ───────────────────────────────────────────────────────────

export const trustedLogoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().min(1, "Logo URL is required"),
  website: z.string().nullable().optional(),
  enabled: z.boolean().default(true),
  order: z.number().default(0),
});

export type TrustedLogoFormData = z.infer<typeof trustedLogoSchema>;

// ─── Homepage Stats ──────────────────────────────────────────────────────────

export const homepageStatisticSchema = z.object({
  title: z.string().min(1, "Title is required"),
  value: z.string().min(1, "Value is required"),
  icon: z.string().nullable().optional(),
  order: z.number().default(0),
});

export type HomepageStatisticFormData = z.infer<typeof homepageStatisticSchema>;

// ─── Homepage Technologies ───────────────────────────────────────────────────

export const homepageTechnologySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  logo: z.string().nullable().optional(),
  experienceLevel: z.string().nullable().optional(),
  order: z.number().default(0),
});

export type HomepageTechnologyFormData = z.infer<typeof homepageTechnologySchema>;
