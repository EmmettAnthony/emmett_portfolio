import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");

// ─── Contact List ────────────────────────────────────────────────────────

export const createContactListSchema = z.object({
  name: z.string().min(1, "List name is required").max(200),
  description: z.string().max(500).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .optional()
    .nullable(),
  isPublic: z.boolean().optional().default(true),
  folderId: z.number().int().optional().nullable(),
});

export const updateContactListSchema = createContactListSchema.partial().extend({
  isDefault: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

// ─── Contact List Member ─────────────────────────────────────────────────

export const createContactMemberSchema = z.object({
  listId: z.string().min(1, "List is required"),
  email: emailSchema,
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  tags: z.string().optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const bulkCreateContactSchema = z.object({
  listId: z.string().min(1, "List is required"),
  contacts: z
    .array(createContactMemberSchema.omit({ listId: true }))
    .min(1)
    .max(1000),
  updateExisting: z.boolean().optional().default(false),
  notifyUrl: z.string().url().optional().nullable(),
});

export const updateContactMemberSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  website: z.string().max(500).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  tags: z.string().optional().nullable(),
  status: z
    .enum(["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING"])
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const importCsvSchema = z.object({
  listId: z.string().min(1, "List is required"),
  csvData: z.string().min(1, "CSV data is required"),
  updateExisting: z.boolean().optional().default(false),
});

// ─── Transactional Email ─────────────────────────────────────────────────

export const sendTransactionalEmailSchema = z.object({
  to: z.array(
    z.object({
      email: emailSchema,
      name: z.string().max(200).optional().nullable(),
    })
  ).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required").max(998),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  templateId: z.number().int().optional().nullable(),
  params: z.record(z.string(), z.string()).optional().nullable(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  replyTo: z
    .object({ email: emailSchema, name: z.string().optional().nullable() })
    .optional()
    .nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const sendBulkTransactionalSchema = z.object({
  messages: z
    .array(sendTransactionalEmailSchema)
    .min(1)
    .max(500),
});

// ─── Campaign ────────────────────────────────────────────────────────────

export const createEmailCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  subject: z.string().min(1, "Subject is required").max(500),
  senderName: z.string().max(200).optional().nullable(),
  senderEmail: emailSchema.optional().nullable(),
  replyTo: emailSchema.optional().nullable(),
  htmlContent: z.string().optional().default(""),
  listIds: z.array(z.string()).min(1, "At least one list is required"),
  segmentIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  tag: z.string().max(100).optional().nullable(),
  abTesting: z
    .object({
      versionA: z.string().min(1),
      versionB: z.string().min(1),
      duration: z.number().int().min(1).max(168),
      winnerCriteria: z.enum(["open", "click"]),
    })
    .optional(),
});

export const updateEmailCampaignSchema = createEmailCampaignSchema.partial();

export const sendTestEmailSchema = z.object({
  campaignId: z.string().min(1),
  emails: z.array(emailSchema).min(1).max(10),
});

export const scheduleCampaignSchema = z.object({
  campaignId: z.string().min(1),
  sendAt: z.string().datetime("Invalid datetime format"),
});

// ─── Email Settings ──────────────────────────────────────────────────────

export const updateEmailSettingsSchema = z.object({
  apiKey: z.string().optional().nullable(),
  smtpServer: z.string().max(200).optional(),
  smtpPort: z.number().int().positive().optional(),
  smtpLogin: z.string().optional().nullable(),
  smtpPassword: z.string().optional().nullable(),
  senderName: z.string().max(200).optional(),
  senderEmail: emailSchema.optional().nullable(),
  replyToEmail: emailSchema.optional().nullable(),
  trackingEnabled: z.boolean().optional(),
  doubleOptIn: z.boolean().optional(),
  defaultListId: z.string().optional().nullable(),
  dailySendLimit: z.number().int().positive().optional(),
  weeklySendLimit: z.number().int().positive().optional(),
  monthlySendLimit: z.number().int().positive().optional(),
  webhookSecret: z.string().optional().nullable(),
});

// ─── Filters ─────────────────────────────────────────────────────────────

export const contactFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING"]).optional(),
  listId: z.string().optional(),
  source: z.string().optional(),
  country: z.string().optional(),
  tag: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const analyticsFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  campaignId: z.string().optional(),
});

// ─── Newsletter Signup (Public) ──────────────────────────────────────────

export const newsletterSignupSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: emailSchema,
  country: z.string().max(100).optional().nullable(),
  interests: z.string().optional().nullable(),
  consent: z
    .boolean()
    .refine((v) => v === true, "You must agree to receive emails"),
  listId: z.string().optional().nullable(),
  source: z.string().optional().default("newsletter_form"),
});
