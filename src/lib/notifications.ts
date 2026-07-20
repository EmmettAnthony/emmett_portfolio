import { prisma } from "@/lib/db";
import type { NotificationCategory, NotificationPriority } from "@/types/notifications";
import type { NotifCategory, NotifPriority, Prisma } from "@prisma/client";
import { sendNotification } from "@/lib/notifications/notification-service";
import type { SendNotificationResult } from "@/lib/notifications/notification-service";

// ─── Create (migrated to sendNotification pipeline → bus → SSE) ───────────────

export async function createNotification(params: {
  title: string;
  message?: string;
  link?: string;
  category: NotifCategory;
  priority?: NotifPriority;
  key?: string;
}): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.user.login",
    title: params.title,
    message: params.message,
    link: params.link,
    key: params.key,
    source: "system",
    categoryOverride: params.category as NotificationCategory,
    priorityOverride: params.priority as NotificationPriority,
  });
}

export async function notifyNewContact(contactId: string, name: string, subject: string): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "contact.submission.new",
    title: `New contact: ${name}`,
    message: `Subject: ${subject}`,
    link: "/dashboard/contact/submissions",
    key: `contact-new-${contactId}`,
    source: "contact",
    categoryOverride: "CONTACT",
  });
}

export async function notifyEscalation(conversationId: string, visitorName: string | null): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "contact.submission.new",
    title: `🚨 Chat escalated: ${visitorName || "a visitor"} needs help`,
    message: "A visitor has requested to speak with a human agent.",
    link: `/dashboard/chatbot/conversations/${conversationId}`,
    key: `chat-escalation-${conversationId}`,
    source: "chatbot",
    categoryOverride: "CONTACT",
    priorityOverride: "HIGH",
  });
}

export async function notifyNewBooking(appointmentId: string, name: string, date: string): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "calendar.appointment.booked",
    title: `New booking: ${name}`,
    message: `Date: ${date}`,
    link: "/dashboard/contact/booking",
    key: `booking-new-${appointmentId}`,
    source: "calendar",
    categoryOverride: "CALENDAR",
  });
}

// ─── Query ─────────────────────────────────────────────────────────────────────

export async function getNotifications(params: {
  userId?: string;
  category?: string;
  priority?: string;
  notifType?: string;
  read?: boolean;
  archived?: boolean;
  pinned?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: string;
}) {
  const where: Prisma.NotificationWhereInput = {};

  if (params.category) where.category = params.category as NotifCategory;
  if (params.priority) where.priority = params.priority as NotifPriority;
  if (params.read !== undefined) where.read = params.read;
  if (params.archived !== undefined) where.archived = params.archived;
  if (params.pinned !== undefined) where.pinned = params.pinned;

  // Build user filter: include both user-specific AND system-wide (null) notifications
  const userFilters: Record<string, unknown>[] = [];
  if (params.userId) {
    userFilters.push({ userId: params.userId });
    userFilters.push({ userId: null });
  }

  // Build search filter
  const searchFilters: Record<string, unknown>[] = [];
  if (params.search) {
    searchFilters.push(
      { title: { contains: params.search, mode: "insensitive" } },
      { message: { contains: params.search, mode: "insensitive" } },
    );
  }

  // Combine filters: userId OR search (Prisma AND/OR composition)
  if (userFilters.length > 0 && searchFilters.length > 0) {
     
    where.AND = [
      { OR: userFilters },
      { OR: searchFilters },
    ] as unknown as Prisma.NotificationWhereInput['AND'];
  } else if (userFilters.length > 0) {
    where.OR = userFilters as unknown as Prisma.NotificationWhereInput['OR'];
  } else if (searchFilters.length > 0) {
    where.OR = searchFilters as unknown as Prisma.NotificationWhereInput['OR'];
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = new Date(params.startDate);
    if (params.endDate) where.createdAt.lte = new Date(params.endDate);
  }

  const page = params.page || 1;
  const limit = Math.min(params.limit || 50, 100);
  const skip = (page - 1) * limit;

  const orderBy: Prisma.NotificationOrderByWithRelationInput = {};
  if (params.sort === "oldest") orderBy.createdAt = "asc";
  else orderBy.createdAt = "desc";

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy, skip, take: limit }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Single-item mutations ─────────────────────────────────────────────────────

export async function markAsRead(idOrIds: string | string[]) {
  const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { read: true } });
  return true;
}

export async function markAsUnread(ids: string[]) {
  await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { read: false } });
  return true;
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return true;
}

// ─── Bulk mutations ────────────────────────────────────────────────────────────

export async function archiveNotifications(ids: string | string[], archived = true) {
  const idsArr = Array.isArray(ids) ? ids : [ids];
  await prisma.notification.updateMany({ where: { id: { in: idsArr } }, data: { archived } });
  return true;
}

export async function pinNotifications(ids: string | string[], pinned = true) {
  const idsArr = Array.isArray(ids) ? ids : [ids];
  await prisma.notification.updateMany({ where: { id: { in: idsArr } }, data: { pinned } });
  return true;
}

export async function deleteNotifications(ids: string[]) {
  await prisma.notification.deleteMany({ where: { id: { in: ids } } });
  return true;
}

export async function acknowledgeNotification(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { acknowledged: true },
  });
  return true;
}

export async function snoozeNotification(id: string, until: Date) {
  await prisma.notification.update({
    where: { id },
    data: { snoozedUntil: until },
  });
  return true;
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

export async function getNotificationAnalytics(startDate?: string, endDate?: string) {
  const where: Prisma.NotificationWhereInput = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [total, unread, byCategory, recent] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, read: false } }),
    prisma.notification.groupBy({ by: ["category"], where, _count: true }),
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return { total, unread, byCategory, recent };
}

// ─── Preferences ───────────────────────────────────────────────────────────────

export async function getNotificationPreferences(userId: string) {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  return prefs || { userId, categoryChannels: {}, emailDigest: "instant", pushEnabled: false, soundEnabled: true, desktopEnabled: false };
}

export async function updateNotificationPreferences(userId: string, data: Record<string, unknown>) {
   
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: data as Prisma.NotificationPreferenceUpdateInput,
    create: { userId, ...data } as Prisma.NotificationPreferenceCreateInput,
  });
}

// ─── Templates ─────────────────────────────────────────────────────────────────

export async function getNotificationTemplates(params: { category?: string } = {}) {
  const where: Prisma.NotificationTemplateWhereInput = {};
  if (params.category) where.category = params.category as NotifCategory;
  return prisma.notificationTemplate.findMany({ where, orderBy: { label: "asc" } });
}

export async function upsertNotificationTemplate(
  data: Record<string, unknown>,
  id?: string
) {
  if (id) {
     
    return prisma.notificationTemplate.update({
      where: { id },
      data: data as Prisma.NotificationTemplateUpdateInput,
    });
  }

  return prisma.notificationTemplate.create({
    data: data as Prisma.NotificationTemplateCreateInput,
  });
}

export async function deleteNotificationTemplate(id: string) {
  await prisma.notificationTemplate.delete({ where: { id } });
  return true;
}
