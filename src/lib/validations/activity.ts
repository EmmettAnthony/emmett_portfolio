import { z } from "zod";

// ─── Activity Log Filter ──────────────────────────────────────────────────
export const activityLogFilterSchema = z.object({
  search: z.string().optional(),
  module: z.string().optional(),
  action: z.string().optional(),
  severity: z.string().optional(),
  userId: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});

// ─── Create Activity Log ──────────────────────────────────────────────────
export const createActivityLogSchema = z.object({
  userId: z.string().optional().nullable(),
  action: z.string().min(1, "Action is required").max(100),
  module: z.string().min(1, "Module is required").max(100),
  entity: z.string().max(100).optional().nullable(),
  entityId: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required").max(1000),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional().default("INFO"),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  ip: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  browser: z.string().max(100).optional().nullable(),
  os: z.string().max(100).optional().nullable(),
  device: z.string().max(100).optional().nullable(),
});

// ─── Create Audit Trail ───────────────────────────────────────────────────
export const createAuditTrailSchema = z.object({
  entityType: z.string().min(1, "Entity type is required").max(100),
  entityId: z.string().min(1, "Entity ID is required"),
  action: z.enum(["create", "update", "delete"]),
  field: z.string().max(100).optional().nullable(),
  beforeValue: z.string().optional().nullable(),
  afterValue: z.string().optional().nullable(),
  beforeData: z.record(z.string(), z.unknown()).optional().nullable(),
  afterData: z.record(z.string(), z.unknown()).optional().nullable(),
  userId: z.string().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

// ─── Audit Trail Filter ───────────────────────────────────────────────────
export const auditTrailFilterSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.enum(["create", "update", "delete"]).optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

// ─── Security Event ───────────────────────────────────────────────────────
export const createSecurityEventSchema = z.object({
  eventType: z.string().min(1, "Event type is required").max(100),
  description: z.string().min(1, "Description is required").max(1000),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).default("WARNING"),
  userId: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

// ─── Security Event Filter ────────────────────────────────────────────────
export const securityEventFilterSchema = z.object({
  eventType: z.string().optional(),
  severity: z.string().optional(),
  resolved: z.coerce.boolean().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});

// ─── Activity Analytics Query ─────────────────────────────────────────────
export const activityAnalyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
