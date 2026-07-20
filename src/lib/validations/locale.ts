import { z } from "zod";

const localeCodeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
const validDirections = ["LTR", "RTL"] as const;

const languageCodeSchema = z
  .string()
  .min(2, "Language code must be at least 2 characters")
  .max(5, "Language code cannot exceed 5 characters")
  .regex(localeCodeRegex, "Must be a valid locale code (e.g. en, fr, zh)");

export const languageSchema = z.object({
  code: languageCodeSchema,
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  nameEn: z
    .string()
    .min(1, "English name is required")
    .max(100, "English name cannot exceed 100 characters"),
  nativeName: z
    .string()
    .min(1, "Native name is required")
    .max(100, "Native name cannot exceed 100 characters"),
  direction: z.enum(validDirections),
  flagEmoji: z
    .string()
    .max(10, "Flag emoji must be 10 characters or less")
    .optional()
    .or(z.literal("")),
  flagImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isEnabled: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  fallbackLocale: z.string().optional().or(z.literal("")),
  order: z.number().int().min(0).optional().default(0),
});

export const languageUpdateSchema = languageSchema.partial();

export const translationGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name cannot exceed 200 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug cannot exceed 200 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
  description: z.string().optional().or(z.literal("")),
  order: z.number().int().min(0).optional().default(0),
});

export const translationSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .max(500, "Key cannot exceed 500 characters")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Key must be alphanumeric with dots, hyphens, and underscores"
    ),
  value: z.string().optional().or(z.literal("")),
  languageId: z.string().min(1, "Language is required"),
  pluralForm: z.string().optional().or(z.literal("")),
  context: z.string().optional().or(z.literal("")),
  needsReview: z.boolean().optional().default(false),
});

export const bulkImportSchema = z.object({
  languageId: z.string().min(1, "Language is required"),
  groupId: z.string().min(1, "Group is required"),
  overwrite: z.boolean().optional().default(false),
  translations: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string().optional().default(""),
      pluralForm: z.string().optional(),
      context: z.string().optional(),
    })
  ),
});

export const localeSettingsSchema = z.object({
  autoDetect: z.boolean().optional(),
  localePrefix: z.enum(["always", "as-needed", "never"]).optional(),
  cookieName: z.string().optional(),
  enableTranslationApi: z.boolean().optional(),
  translationApiProvider: z.string().optional().or(z.literal("")),
  translationApiKey: z.string().optional().or(z.literal("")),
});

export type LanguageInput = z.infer<typeof languageSchema>;
export type LanguageUpdateInput = z.infer<typeof languageUpdateSchema>;
export type TranslationGroupInput = z.infer<typeof translationGroupSchema>;
export type TranslationInput = z.infer<typeof translationSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
export type LocaleSettingsInput = z.infer<typeof localeSettingsSchema>;
