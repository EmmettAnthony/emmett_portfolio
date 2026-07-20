import { z } from "zod";

// ─── Notification Filter / Query ──────────────────────────────────────────
export const notificationFilterSchema = z.object({
  category: z.string().optional(),
  priority: z.string().optional(),
  notifType: z.string().optional(),
  read: z.coerce.boolean().optional(),
  archived: z.coerce.boolean().optional(),
  pinned: z.coerce.boolean().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.enum(["newest", "oldest", "priority"]).optional().default("newest"),
});

// ─── Create Notification ──────────────────────────────────────────────────
export const createNotificationSchema = z.object({
  userId: z.string().optional().nullable(),
  category: z.enum(["CRM", "CONTACT", "CALENDAR", "PORTFOLIO", "NEWSLETTER", "RESUME", "TESTIMONIAL", "SYSTEM"]).default("SYSTEM"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  notifType: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]).default("INFO"),
  key: z.string().max(200).optional().nullable(),
  title: z.string().min(1, "Title is required").max(300),
  message: z.string().max(2000).optional().nullable(),
  link: z.string().max(500).optional().nullable(),
  image: z.string().url().optional().nullable().or(z.literal("")),
  actionLabel: z.string().max(100).optional().nullable(),
  actionUrl: z.string().max(500).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  channels: z.array(z.enum(["IN_APP", "EMAIL", "PUSH", "SMS", "WHATSAPP"])).optional().default(["IN_APP"]),
});

// ─── Update Notification (mark read, archive, pin, etc.) ──────────────────
export const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
  archived: z.boolean().optional(),
  pinned: z.boolean().optional(),
  acknowledged: z.boolean().optional(),
  snoozedUntil: z.string().datetime().optional().nullable(),
});

// ─── Bulk Action ──────────────────────────────────────────────────────────
export const bulkNotificationActionSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(["mark_read", "mark_unread", "archive", "unarchive", "pin", "unpin", "delete"]),
});

// ─── Notification Preferences ─────────────────────────────────────────────
export const updateNotificationPreferencesSchema = z.object({
  categoryChannels: z
    .record(
      z.enum(["CRM", "CONTACT", "CALENDAR", "PORTFOLIO", "NEWSLETTER", "RESUME", "TESTIMONIAL", "SYSTEM"]),
      z.array(z.enum(["IN_APP", "EMAIL", "PUSH", "SMS", "WHATSAPP"]))
    )
    .optional(),
  emailDigest: z.enum(["instant", "daily", "weekly", "never"]).optional(),
  pushEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  desktopEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional().nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional().nullable(),
  snoozeUntil: z.string().datetime().optional().nullable(),
});

// ─── Notification Template ────────────────────────────────────────────────
export const createNotificationTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(200),
  label: z.string().min(1, "Label is required").max(200),
  category: z.enum(["CRM", "CONTACT", "CALENDAR", "PORTFOLIO", "NEWSLETTER", "RESUME", "TESTIMONIAL", "SYSTEM"]).default("SYSTEM"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  notifType: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]).default("INFO"),
  title: z.string().min(1, "Title is required").max(300),
  message: z.string().max(2000).optional().nullable(),
  emailSubject: z.string().max(500).optional().nullable(),
  emailBody: z.string().optional().nullable(),
  pushTitle: z.string().max(200).optional().nullable(),
  pushBody: z.string().max(500).optional().nullable(),
  variables: z.array(z.string()).optional().default([]),
  channels: z.array(z.enum(["IN_APP", "EMAIL", "PUSH", "SMS", "WHATSAPP"])).optional().default(["IN_APP"]),
  actionLabel: z.string().max(100).optional().nullable(),
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();

// ─── Notification Analytics Query ─────────────────────────────────────────
export const notificationAnalyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
});
