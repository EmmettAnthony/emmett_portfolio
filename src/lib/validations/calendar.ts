import { z } from "zod";

// ─── Event Validation ────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  allDay: z.boolean().optional().default(false),
  location: z.string().max(500).optional().nullable(),
  link: z.string().url().optional().nullable().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional().default("#3b82f6"),
  eventType: z.enum(["MEETING", "CONSULTATION", "PROJECT_DEADLINE", "PERSONAL", "TASK", "REMINDER"]),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"]).optional().default("SCHEDULED"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  notes: z.string().max(5000).optional().nullable(),
  attachments: z.string().optional().nullable(),
  recurring: z.string().optional().nullable(),
  meetingTypeId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  reminderId: z.string().optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

// ─── Appointment Validation ──────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  projectType: z.string().max(100).optional().nullable(),
  preferredDate: z.string().min(1, "Date is required"),
  preferredTime: z.string().optional().nullable(),
  duration: z.number().int().min(15).max(480).optional().default(30),
  message: z.string().max(2000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW"]).optional().default("PENDING"),
  source: z.enum(["WEBSITE", "DASHBOARD", "REFERRAL", "OTHER"]).optional().default("WEBSITE"),
  timezone: z.string().optional().nullable(),
  meetingTypeId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  cancellationReason: z.string().max(1000).optional().nullable(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

// ─── Public Booking Validation ───────────────────────────────────────────────

import { projectTypes, budgetRanges, timelines } from "@/lib/contact-schema";

export const publicBookingSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  projectType: z.enum(projectTypes as unknown as [string, ...string[]]).optional().nullable(),
  budget: z.enum(budgetRanges as unknown as [string, ...string[]]).optional().nullable(),
  timeline: z.enum(timelines as unknown as [string, ...string[]]).optional().nullable(),
  projectDescription: z.string().max(5000).optional().nullable(),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]).optional().nullable(),
  preferredDate: z.string().min(1, "Date is required"),
  preferredTime: z.string().min(1, "Time is required"),
  duration: z.number().int().min(15).max(480).optional().default(30),
  timezone: z.string().optional().nullable(),
  fileUrl: z.string().max(1000).optional().nullable(),
  fileName: z.string().max(200).optional().nullable(),
  newsletter: z.boolean().optional().default(false),
  terms: z.boolean().refine((val) => val === true, { message: "You must accept the terms & privacy policy" }),
  meetingTypeId: z.string().optional().nullable(),
});

// ─── Task Validation ─────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional().default("PENDING"),
  progress: z.number().int().min(0).max(100).optional().default(0),
  category: z.string().max(50).optional().nullable(),
  tags: z.string().optional().nullable(),
  order: z.number().int().optional().default(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#8b5cf6"),
});

export const updateTaskSchema = createTaskSchema.partial();

// ─── Reminder Validation ─────────────────────────────────────────────────────

export const createReminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  remindAt: z.string().min(1, "Reminder time is required"),
  remindType: z.enum(["EMAIL", "DASHBOARD", "BOTH"]).optional().default("DASHBOARD"),
  status: z.enum(["PENDING", "SENT", "DISMISSED"]).optional().default("PENDING"),
  relatedType: z.string().optional().nullable(),
  relatedId: z.string().optional().nullable(),
  repeatInterval: z.string().optional().nullable(),
  repeatUntil: z.string().optional().nullable(),
});

export const updateReminderSchema = createReminderSchema.partial();

// ─── Availability Validation ─────────────────────────────────────────────────

export const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isActive: z.boolean().optional().default(true),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional().nullable(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional().nullable(),
  slotDuration: z.number().int().min(15).max(240).optional().default(30),
});

export const updateAvailabilitySchema = createAvailabilitySchema.partial();

// ─── Date Exception Validation ───────────────────────────────────────────────

export const createDateExceptionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(["HOLIDAY", "VACATION", "BLOCKED", "SPECIAL_HOURS"]),
  title: z.string().max(200).optional().nullable(),
  isAvailable: z.boolean().optional().default(false),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

// ─── Meeting Type Validation ─────────────────────────────────────────────────

export const createMeetingTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional().nullable(),
  duration: z.number().int().min(15).max(480),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#3b82f6"),
  icon: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

export const updateMeetingTypeSchema = createMeetingTypeSchema.partial();

// ─── Calendar Integration Validation ─────────────────────────────────────────

export const createIntegrationSchema = z.object({
  provider: z.enum(["GOOGLE", "OUTLOOK", "APPLE"]),
  email: z.string().email().optional().nullable(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
  tokenExpiry: z.string().optional().nullable(),
  calendarId: z.string().optional().nullable(),
  calendarName: z.string().optional().nullable(),
  syncEnabled: z.boolean().optional().default(true),
  syncDirection: z.enum(["IMPORT", "EXPORT", "BOTH"]).optional().default("BOTH"),
});

// ─── Analytics Query ─────────────────────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
