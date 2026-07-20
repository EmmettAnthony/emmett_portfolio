// ──────────────────────────────────────────────────────────────────────────────
// Enterprise Notification Service
// ──────────────────────────────────────────────────────────────────────────────
// Orchestrates creating, delivering, and logging notifications across all
// channels: in-app, email, push (future), SMS (future), WhatsApp (future).
// Respects per-user preferences and uses NotificationTemplate for content.
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getResend } from "@/lib/resend";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationType,
  DeliveryChannel,
  NotificationEventKey,
} from "@/types/notifications";
import {
  EVENT_CATEGORY_MAP,
  EVENT_PRIORITY_MAP,
  EVENT_TYPE_MAP,
} from "@/types/notifications";
import { logActivity } from "@/lib/activity";
import { emitNotification } from "@/lib/notifications/notification-bus";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  /** Optional user ID (null = system-wide notification) */
  userId?: string | null;
  /** Event key used to look up category, priority, and type defaults */
  eventKey: NotificationEventKey | string;
  title: string;
  message?: string;
  link?: string;
  image?: string;
  /** Unique key for deduplication */
  key?: string;
  actionLabel?: string;
  actionUrl?: string;
  /** Override the category inferred from eventKey */
  categoryOverride?: NotificationCategory;
  /** Override the priority inferred from eventKey */
  priorityOverride?: NotificationPriority;
  /** Override the type inferred from eventKey */
  typeOverride?: NotificationType;
  /** Override delivery channels (default: from user preferences or ["IN_APP"]) */
  channelsOverride?: DeliveryChannel[];
  /** Extra metadata stored on the notification */
  metadata?: Record<string, unknown>;
  /** Source module identifier */
  source?: string;
  /** Schedule for later delivery */
  scheduledAt?: Date;
  /** Auto-expire after this date */
  expiresAt?: Date;
  /** Whether to log this in the activity log (default: true) */
  logActivity?: boolean;
  /** Activity description override */
  activityDescription?: string;
}

export interface SendNotificationResult {
  notificationId: string;
  channels: { channel: DeliveryChannel; status: string; error?: string }[];
}

// ─── Default channel map per category when no user preferences exist ────────

const DEFAULT_CHANNELS: Record<string, DeliveryChannel[]> = {
  CRM: ["IN_APP", "EMAIL"],
  CONTACT: ["IN_APP", "EMAIL"],
  CALENDAR: ["IN_APP", "EMAIL"],
  PORTFOLIO: ["IN_APP"],
  NEWSLETTER: ["IN_APP"],
  RESUME: ["IN_APP"],
  TESTIMONIAL: ["IN_APP"],
  SYSTEM: ["IN_APP", "EMAIL"],
};

// ─── Interpolate template variables ─────────────────────────────────────────

export function interpolate(
  template: string,
  variables: Record<string, string | number | boolean | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = variables[key];
    if (val === null || val === undefined) return `{{${key}}}`;
    return String(val);
  });
}

// ─── Resolve user delivery preferences ──────────────────────────────────────

async function resolveChannels(
  userId: string | null | undefined,
  category: NotificationCategory
): Promise<DeliveryChannel[]> {
  if (!userId) return DEFAULT_CHANNELS[category] || ["IN_APP"];

  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (prefs?.categoryChannels) {
      const channels = (prefs.categoryChannels as Record<string, DeliveryChannel[]>)[category];
      if (channels && channels.length > 0) return channels;
    }

    return DEFAULT_CHANNELS[category] || ["IN_APP"];
  } catch {
    return DEFAULT_CHANNELS[category] || ["IN_APP"];
  }
}

// ─── Main notification creation & dispatch ─────────────────────────────────

export async function sendNotification(
  payload: NotificationPayload
): Promise<SendNotificationResult> {
  const category = payload.categoryOverride || (EVENT_CATEGORY_MAP[payload.eventKey] as NotificationCategory) || "SYSTEM";
  const priority = payload.priorityOverride || (EVENT_PRIORITY_MAP[payload.eventKey] as NotificationPriority) || "MEDIUM";
  const notifType = payload.typeOverride || (EVENT_TYPE_MAP[payload.eventKey] as NotificationType) || "INFO";

  // Determine delivery channels
  const channels = payload.channelsOverride || (await resolveChannels(payload.userId, category));

  // Check quiet hours (skip non-critical during quiet hours)
  const shouldDeliverNow = await checkQuietHours(payload.userId, priority);

  // Determine sentAt
  const sentAt = shouldDeliverNow ? new Date() : null;

  // Create in-app notification (always store it)
  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId ?? null,
      category,
      priority,
      notifType,
      key: payload.key ?? null,
      title: payload.title,
      message: payload.message ?? null,
      link: payload.link ?? null,
      image: payload.image ?? null,
      actionLabel: payload.actionLabel ?? null,
      actionUrl: payload.actionUrl ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: payload.metadata !== null && payload.metadata !== undefined ? payload.metadata as any : Prisma.DbNull,
      source: payload.source ?? null,
      sentAt,
      expiresAt: payload.expiresAt ?? null,
    },
  });

  const results: { channel: DeliveryChannel; status: string; error?: string }[] = [];

  // Dispatch to each channel
  for (const channel of channels) {
    if (channel === "IN_APP") {
      // Already created above — log as delivered
      await logNotificationDelivery(notification.id, channel, "delivered");
      results.push({ channel, status: "delivered" });
      continue;
    }

    if (channel === "EMAIL" && shouldDeliverNow) {
      const emailResult = await dispatchEmail(notification, payload);
      await logNotificationDelivery(notification.id, channel, emailResult.status, emailResult.error);
      results.push({ channel, status: emailResult.status, error: emailResult.error });
      continue;
    }

    // Future channels (PUSH, SMS, WHATSAPP) — mark as queued
    await logNotificationDelivery(notification.id, channel, "queued");
    results.push({ channel, status: "queued" });
  }

  // Activity logging
  const shouldLog = payload.logActivity !== false;
  if (shouldLog) {
    try {
      await logActivity({
        action: "notif_sent",
        module: category.toLowerCase(),
        entity: "Notification",
        entityId: notification.id,
        description: payload.activityDescription || `Notification sent: ${payload.title}`,
        severity: priority === "CRITICAL" ? "ERROR" : priority === "HIGH" ? "WARNING" : "INFO",
      });
    } catch {
      // Activity logging is non-critical
    }
  }

  // Emit real-time event for SSE clients
  try {
    emitNotification({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notification: notification as any as import("@/types/notifications").NotificationData,
      eventKey: payload.eventKey,
      isUrgent: priority === "HIGH" || priority === "CRITICAL",
    });
  } catch {
    // Non-critical
  }

  return {
    notificationId: notification.id,
    channels: results,
  };
}

// ─── Email dispatch via Resend ──────────────────────────────────────────────

async function dispatchEmail(
  notification: { id: string; userId: string | null; title: string; message: string | null; metadata: unknown },
  payload: NotificationPayload
): Promise<{ status: string; error?: string }> {
  try {
    const resend = getResend();
    const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";

    // Look up recipient email
    let recipientEmail: string | null = null;
    if (payload.userId) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true },
      });
      recipientEmail = user?.email ?? null;
    }

    if (!recipientEmail) {
      return { status: "failed", error: "No recipient email found" };
    }

    // Build email content
    const emailHtml = buildEmailHtml(notification.title, notification.message || "");
    const emailSubject = `[${payload.eventKey}] ${notification.title}`;

    const result = await resend.emails.send({
      from: `Notifications <${senderEmail}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
      headers: {
        "X-Notification-ID": notification.id,
      },
    });

    if (result.error) {
      return { status: "failed", error: result.error.message };
    }

    return { status: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    return { status: "failed", error: message };
  }
}

// ─── Build email HTML from notification content ────────────────────────────

function buildEmailHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#1e40af,#3b82f6)">
              <h1 style="margin:0;font-size:20px;color:#ffffff;text-align:center">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#374151">${escapeHtml(message).replace(/\n/g, "<br>")}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;text-align:center">
              <p style="margin:0;font-size:12px;color:#9ca3af">This is an automated notification from your portfolio platform.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Log notification delivery ──────────────────────────────────────────────

async function logNotificationDelivery(
  notificationId: string,
  channel: DeliveryChannel,
  status: string,
  error?: string
) {
  try {
    await prisma.notificationLog.create({
      data: {
        notificationId,
        channel,
        status,
        error: error || null,
        ...(status === "sent" || status === "delivered" ? { sentAt: new Date(), deliveredAt: new Date() } : {}),
      },
    });
  } catch {
    // Non-critical
  }
}

// ─── Check quiet hours ──────────────────────────────────────────────────────

async function checkQuietHours(
  userId: string | null | undefined,
  priority: NotificationPriority
): Promise<boolean> {
  // Critical notifications always bypass quiet hours
  if (priority === "CRITICAL") return true;

  // High-priority notifications also bypass quiet hours
  const canBypassQuietHours = priority === "HIGH";

  if (!userId) return true;

  try {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (prefs?.quietHoursStart && prefs?.quietHoursEnd) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${hours}:${minutes}`;

      const startMinutes = timeToMinutes(prefs.quietHoursStart);
      const endMinutes = timeToMinutes(prefs.quietHoursEnd);
      const currentMinutes = timeToMinutes(currentTime);

      let inQuietHours: boolean;
      if (startMinutes <= endMinutes) {
        // Same-day range (e.g., 14:00 - 17:00)
        inQuietHours = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        // Overnight range (e.g., 22:00 - 07:00)
        inQuietHours = currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }

      // During quiet hours, only deliver if priority allows bypass
      if (inQuietHours && !canBypassQuietHours) {
        return false;
      }
    }

    // Check global snooze
    if (prefs?.snoozeUntil && new Date(prefs.snoozeUntil) > new Date()) {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ─── Convenience: create from template ──────────────────────────────────────

export async function sendNotificationFromTemplate(
  templateName: string,
  variables: Record<string, string | number | boolean | null | undefined>,
  overrides?: {
    userId?: string | null;
    link?: string;
    key?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<SendNotificationResult | null> {
  const template = await prisma.notificationTemplate.findUnique({
    where: { name: templateName },
  });

  if (!template) return null;

  const title = interpolate(template.title, variables);
  const message = template.message ? interpolate(template.message, variables) : undefined;

  return sendNotification({
    userId: overrides?.userId,
    eventKey: templateName as NotificationEventKey,
    title,
    message,
    link: overrides?.link,
    key: overrides?.key,
    source: overrides?.source,
    metadata: overrides?.metadata,
    categoryOverride: template.category as NotificationCategory,
    priorityOverride: template.priority as NotificationPriority,
    typeOverride: template.notifType as NotificationType,
    channelsOverride: template.channels as DeliveryChannel[],
  });
}

// ─── Mark-as-read (with activity log) ───────────────────────────────────────

export async function markNotificationRead(
  notificationId: string,
  _userId?: string
) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  await logNotificationDelivery(notificationId, "IN_APP", "opened");

  try {
    await logActivity({
      action: "notif_read",
      module: "system",
      entity: "Notification",
      entityId: notificationId,
      description: "Notification marked as read",
      severity: "INFO",
    });
  } catch {
    // Non-critical
  }
}

// ─── Get unread count ───────────────────────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
      archived: false,
       
      OR: [
        { snoozedUntil: null },
        { snoozedUntil: { lte: new Date() } },
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
      ] as any,
    },
  });
}
