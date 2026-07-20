import { prisma } from "@/lib/db";
import { logActivity, createSecurityEvent } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

// ─── Auto-logging wrapper: call this in API routes instead of writing manual logs ──
// These let you say "automatically log this CRUD" with one line.

export async function autoLogCreate(
  module: string,
  entity: string,
  entityId: string,
  description: string,
  userId?: string,
  metadata?: Record<string, unknown>,
) {
  return logActivity({
    action: "create",
    module,
    entity,
    entityId,
    description,
    userId,
    severity: "INFO",
    metadata,
  });
}

export async function autoLogUpdate(
  module: string,
  entity: string,
  entityId: string,
  description: string,
  userId?: string,
  metadata?: Record<string, unknown>,
) {
  return logActivity({
    action: "update",
    module,
    entity,
    entityId,
    description,
    userId,
    severity: "INFO",
    metadata,
  });
}

export async function autoLogDelete(
  module: string,
  entity: string,
  entityId: string,
  description: string,
  userId?: string,
  metadata?: Record<string, unknown>,
) {
  return logActivity({
    action: "delete",
    module,
    entity,
    entityId,
    description,
    userId,
    severity: "WARNING",
    metadata,
  });
}

export async function autoLogAction(
  action: string,
  module: string,
  description: string,
  userId?: string,
  entity?: string,
  entityId?: string,
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL" = "INFO",
  metadata?: Record<string, unknown>,
) {
  return logActivity({
    action,
    module,
    description,
    userId,
    entity,
    entityId,
    severity,
    metadata,
  });
}

// ─── Security + Notification Integration ─────────────────────────────────

export async function autoLogSecurityEvent(
  eventType: string,
  description: string,
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL" = "WARNING",
  userId?: string,
  ipAddress?: string,
  metadata?: Record<string, unknown>,
) {
  // Log the security event
  await createSecurityEvent({ eventType, description, severity, userId, ipAddress, metadata });

  // Also log to activity
  await logActivity({
    action: eventType,
    module: "auth",
    description,
    userId,
    severity,
    metadata,
    ip: ipAddress,
  });

  // For CRITICAL events, also create a notification
  if (severity === "CRITICAL") {
    try {
      await createNotification({
        title: `🔴 Security Alert: ${eventType.replace(/_/g, " ")}`,
        message: description,
        category: "SYSTEM",
        priority: "CRITICAL",
        key: `security-${eventType}-${Date.now()}`,
      });
    } catch (err) {
      console.error("Failed to create security notification:", err);
    }
  }

  return true;
}

// ─── Session Tracking ────────────────────────────────────────────────────
export async function trackUserSession(
  userId: string,
  sessionToken: string,
  ipAddress?: string,
  userAgent?: string,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.userSession.create as any)({
      data: {
        userId,
        sessionToken,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    console.error("Failed to track user session:", err);
  }
}

export async function endUserSessionTracking(sessionToken: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.userSession.updateMany as any)({
      where: { sessionToken, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });
  } catch (err) {
    console.error("Failed to end user session:", err);
  }
}

// ─── Audit Trail Auto-logger ─────────────────────────────────────────────
export async function autoLogAuditTrail(
  entityType: string,
  entityId: string,
  action: "create" | "update" | "delete",
  userId?: string,
  beforeData?: Record<string, unknown>,
  afterData?: Record<string, unknown>,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.auditTrail.create as any)({
      data: {
        entityType,
        entityId,
        action,
        beforeData: beforeData || undefined,
        afterData: afterData || undefined,
        userId: userId || null,
        description: `${action === "create" ? "Created" : action === "delete" ? "Deleted" : "Updated"} ${entityType}`,
      },
    });
  } catch (err) {
    console.error("Failed to create audit trail:", err);
  }
}
