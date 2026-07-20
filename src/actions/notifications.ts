"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import type { NotifCategory, NotifPriority, NotifType } from "@prisma/client";

// ─── Create Notification ───────────────────────────────────────────────────

export async function createNotificationAction(data: {
  title: string;
  message?: string;
  link?: string;
  category?: string;
  priority?: string;
  notifType?: string;
  key?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const notification = await prisma.notification.create({
    data: {
      userId: session.user.id as string,
      title: data.title,
      message: data.message ?? null,
      link: data.link ?? null,
      key: data.key ?? null,
      category: (data.category || "SYSTEM") as NotifCategory,
      priority: (data.priority || "MEDIUM") as NotifPriority,
      notifType: (data.notifType || "INFO") as NotifType,
    },
  });

  revalidatePath("/dashboard/notifications");
  return { id: notification.id, success: true };
}

// ─── Mark as Read ──────────────────────────────────────────────────────────

export async function markAsReadAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.update({ where: { id }, data: { read: true } });
  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// ─── Mark All as Read ─────────────────────────────────────────────────────

export async function markAllAsReadAction() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id as string, read: false },
    data: { read: true },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// ─── Bulk Action (mark_read, mark_unread, archive, unarchive, pin, unpin, delete) ─

export async function bulkNotificationAction(
  ids: string[],
  action: "mark_read" | "mark_unread" | "archive" | "unarchive" | "pin" | "unpin" | "delete"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  switch (action) {
    case "mark_read":
      await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { read: true } });
      break;
    case "mark_unread":
      await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { read: false } });
      break;
    case "archive":
      await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { archived: true } });
      break;
    case "unarchive":
      await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { archived: false } });
      break;
    case "pin":
      await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { pinned: true } });
      break;
    case "unpin":
      await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { pinned: false } });
      break;
    case "delete":
      await prisma.notification.deleteMany({ where: { id: { in: ids } } });
      break;
  }

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// ─── Delete Notification ────────────────────────────────────────────────────

export async function deleteNotificationAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.delete({ where: { id } });
  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// ─── Archive Notification ───────────────────────────────────────────────────

export async function archiveNotificationAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notification.update({ where: { id }, data: { archived: true } });
  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// ─── Get Unread Count ──────────────────────────────────────────────────────

export async function getUnreadCountAction() {
  const session = await auth();
  if (!session?.user) return { count: 0 };

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id as string,
      read: false,
      archived: false,
    },
  });

  return { count };
}

// ─── Update Notification Preferences ───────────────────────────────────────

export async function updatePreferencesAction(data: {
  categoryChannels?: Record<string, string[]>;
  emailDigest?: string;
  pushEnabled?: boolean;
  soundEnabled?: boolean;
  desktopEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.notificationPreference.upsert({
    where: { userId: session.user.id as string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: data as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { userId: session.user.id as string, ...data } as any,
  });

  revalidatePath("/dashboard/notifications/settings");
  return { success: true };
}
