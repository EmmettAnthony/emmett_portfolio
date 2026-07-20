import { z } from "zod";

// ─── About Page (Singleton) ──────────────────────────────────────────────────

export const aboutPageSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  professionalTitle: z.string().min(1, "Professional title is required"),
  shortIntro: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
  resumeUrl: z.string().nullable().optional(),

  // Professional Summary
  summaryHeading: z.string().nullable().optional(),
  shortBio: z.string().nullable().optional(),
  fullBiography: z.string().nullable().optional(),
  yearsOfExperience: z.number().nullable().optional(),
  missionStatement: z.string().nullable().optional(),
  visionStatement: z.string().nullable().optional(),

  // Why Work With Me
  whyWorkWithMe: z
    .array(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        icon: z.string().optional(),
      })
    )
    .default([]),

  // Work Process
  workProcess: z
    .array(
      z.object({
        step: z.number(),
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        icon: z.string().optional(),
      })
    )
    .default([]),

  // Personal Interests
  personalInterests: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().min(1, "Description is required"),
        icon: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .default([]),

  // Social Links
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1, "Platform is required"),
        url: z.string().url("Must be a valid URL"),
        icon: z.string().optional(),
        enabled: z.boolean().default(true),
      })
    )
    .default([]),

  // FAQs
  faqs: z
    .array(
      z.object({
        question: z.string().min(1, "Question is required"),
        answer: z.string().min(1, "Answer is required"),
        order: z.number().default(0),
      })
    )
    .default([]),

  // CTA Section
  ctaHeading: z.string().nullable().optional(),
  ctaDescription: z.string().nullable().optional(),
  ctaPrimaryButton: z.string().nullable().optional(),
  ctaPrimaryLink: z.string().nullable().optional(),
  ctaSecondaryButton: z.string().nullable().optional(),
  ctaSecondaryLink: z.string().nullable().optional(),
  ctaBackground: z.string().nullable().optional(),

  // SEO
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  metaKeywords: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),

  // Settings
  published: z.boolean().default(false),
});

export type AboutPageFormData = z.infer<typeof aboutPageSchema>;

// ─── Statistics ──────────────────────────────────────────────────────────────

export const aboutStatisticSchema = z.object({
  title: z.string().min(1, "Title is required"),
  value: z.string().min(1, "Value is required"),
  suffix: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  order: z.number().default(0),
});

export type AboutStatisticFormData = z.infer<typeof aboutStatisticSchema>;

// ─── Technologies ────────────────────────────────────────────────────────────

export const aboutTechnologySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  logo: z.string().nullable().optional(),
  experienceLevel: z.string().nullable().optional(),
  order: z.number().default(0),
});

export type AboutTechnologyFormData = z.infer<typeof aboutTechnologySchema>;

// ─── Individual Items (for inline editing) ───────────────────────────────────

export const whyWorkWithMeItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().optional(),
});

export const workProcessStepSchema = z.object({
  step: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().optional(),
});

export const personalInterestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().optional(),
  image: z.string().optional(),
});

export const socialLinkItemSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Must be a valid URL"),
  icon: z.string().optional(),
  enabled: z.boolean().default(true),
});

export const faqItemSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  order: z.number().default(0),
});
