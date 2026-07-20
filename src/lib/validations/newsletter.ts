import { z } from "zod";

const emailSchema = z.string().email({ message: "Invalid email address" });

// Subscriber
export const createSubscriberSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: emailSchema,
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  tags: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  gdprConsent: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

export const updateSubscriberSchema = createSubscriberSchema.partial().extend({
  status: z.enum(["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING_VERIFICATION"]).optional(),
  timezone: z.string().max(100).optional().nullable(),
});

export const bulkImportSchema = z.object({
  subscribers: z.array(createSubscriberSchema).min(1).max(1000),
  overwriteExisting: z.boolean().optional().default(false),
});

export const subscriberFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING_VERIFICATION"]).optional(),
  source: z.string().optional(),
  country: z.string().optional(),
  tag: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Signup form — name is optional (UI shows "Your name (optional)")
export const newsletterSignupSchema = z.object({
  name: z.string().max(200).optional(),
  email: emailSchema,
  gdprConsent: z.boolean().refine((v) => v === true, "You must agree to receive emails"),
  source: z.string().optional(),
});

// Preferences
export const updatePreferencesSchema = z.object({
  topics: z.string().optional().nullable(),
  emailFrequency: z.enum(["instant", "daily", "weekly", "monthly"]).optional(),
  receivePromotions: z.boolean().optional(),
  receiveNewsletters: z.boolean().optional(),
  receiveBlogUpdates: z.boolean().optional(),
});

export const unsubscribeSchema = z.object({
  email: emailSchema,
  reason: z.string().max(500).optional().nullable(),
  detail: z.string().max(2000).optional().nullable(),
  campaignId: z.string().optional().nullable(),
});

// Campaign
export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  subject: z.string().min(1, "Subject is required").max(500),
  previewText: z.string().max(300).optional().nullable(),
  senderName: z.string().max(200).optional().nullable(),
  senderEmail: emailSchema.optional().nullable(),
  content: z.string().optional().default(""),
  templateId: z.string().optional().nullable(),
  segmentId: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  testEmails: z.string().optional().nullable(),
  abTestEnabled: z.boolean().optional().default(false),
  abTestVariantA: z.string().optional().nullable(),
  abTestVariantB: z.string().optional().nullable(),
  timezoneOptimize: z.boolean().optional().default(false),
  recurringFrequency: z.enum(["daily", "weekly", "monthly"]).optional().nullable(),
  recurringDayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  recurringDayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  recurringEndsAt: z.string().datetime().optional().nullable(),
  recurringMaxCount: z.number().int().positive().optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const sendTestEmailSchema = z.object({
  campaignId: z.string().min(1),
  testEmails: z.array(emailSchema).min(1).max(10),
});

// Template
export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(200),
  description: z.string().max(500).optional().nullable(),
  content: z.string().optional().default(""),
  category: z.enum(["company_newsletter", "product_update", "blog_digest", "announcement", "promotion", "event", "custom"]).optional().nullable(),
  thumbnail: z.string().optional().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// Automation
export const createAutomationSchema = z.object({
  name: z.string().min(1, "Automation name is required").max(200),
  description: z.string().max(500).optional().nullable(),
  triggerType: z.enum(["welcome_series", "blog_notification", "lead_nurturing", "re_engagement", "tag_added", "custom"]),
  triggerConfig: z.record(z.string(), z.unknown()).optional().nullable(),
  campaignId: z.string().optional().nullable(),
});

export const updateAutomationSchema = createAutomationSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

export const createAutomationStepSchema = z.object({
  automationId: z.string().min(1),
  stepOrder: z.number().int().min(0),
  name: z.string().min(1, "Step name is required").max(200),
  subject: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  delayDays: z.number().int().min(0).optional().default(0),
  delayHours: z.number().int().min(0).max(23).optional().default(0),
  condition: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateAutomationStepSchema = createAutomationStepSchema.partial();

export const popupPageConfigSchema = z.record(
  z.string(),
  z.boolean()
);

// Settings
export const updateNewsletterSettingsSchema = z.object({
  defaultSenderName: z.string().max(200).optional(),
  defaultSenderEmail: emailSchema.optional().nullable(),
  replyToEmail: emailSchema.optional().nullable(),
  dailySendLimit: z.number().int().positive().optional(),
  weeklySendLimit: z.number().int().positive().optional(),
  monthlySendLimit: z.number().int().positive().optional(),
  doubleOptIn: z.boolean().optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
  gdprEnabled: z.boolean().optional(),
  unsubscribeFooter: z.string().optional().nullable(),
  footerHtml: z.string().optional().nullable(),
});

export const updatePopupConfigSchema = z.object({
  popupConfig: z.object({
    enabled: z.boolean().optional(),
    perPage: popupPageConfigSchema.optional(),
    defaultEnabled: z.boolean().optional(),
  }).optional(),
});

// Segment
export const createSegmentSchema = z.object({
  name: z.string().min(1, "Segment name is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  description: z.string().max(500).optional().nullable(),
  criteria: z.record(z.string(), z.unknown()).optional().nullable(),
  isDynamic: z.boolean().optional().default(true),
  tagIds: z.array(z.string()).optional().default([]),
});

export const updateSegmentSchema = createSegmentSchema.partial();

// Tag
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color").optional().default("#3b82f6"),
  description: z.string().max(300).optional().nullable(),
});

export const updateTagSchema = createTagSchema.partial();

// Analytics
export const analyticsFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  campaignId: z.string().optional(),
});
