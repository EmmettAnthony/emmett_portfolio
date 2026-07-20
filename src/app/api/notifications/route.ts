import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  archiveNotifications,
  pinNotifications,
  deleteNotifications,
  acknowledgeNotification,
  snoozeNotification,
} from "@/lib/notifications";
import { notificationFilterSchema, bulkNotificationActionSchema, updateNotificationSchema, createNotificationSchema } from "@/lib/validations/notifications";
import { sendNotification } from "@/lib/notifications/notification-service";
import type { NotificationPayload } from "@/lib/notifications/notification-service";

// ─── POST /api/notifications ──────────────────────────────────────────────
// Creates a test notification for the authenticated user.
// Body: { title, message?, link?, priority?, category? }
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createNotificationSchema.parse(body);

    const payload: NotificationPayload = {
      userId: session.user.id as string,
      eventKey: "system.user.login",
      title: parsed.title,
      message: parsed.message ?? undefined,
      link: parsed.link ?? "/dashboard/notifications",
      priorityOverride: parsed.priority,
      categoryOverride: parsed.category,
      typeOverride: parsed.notifType,
      source: parsed.source ?? "system",
      channelsOverride: parsed.channels,
      metadata: parsed.metadata ?? { test: true, createdBy: "api" },
    };

    const result = await sendNotification(payload);

    return NextResponse.json({
      success: true,
      notificationId: result.notificationId,
      channels: result.channels,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

// ─── GET /api/notifications ───────────────────────────────────────────────
// Query params: category, priority, notifType, read, archived, pinned, search, startDate, endDate, page, limit, sort
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawFilters = Object.fromEntries(searchParams.entries());
    const filters = notificationFilterSchema.parse(rawFilters);

    const result = await getNotifications({
      userId: session.user.id as string | undefined,
      category: filters.category,
      priority: filters.priority,
      notifType: filters.notifType,
      read: filters.read,
      archived: filters.archived,
      pinned: filters.pinned,
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// ─── PATCH /api/notifications ─────────────────────────────────────────────
// Body: { id: "..." } or { markAllRead: true } or { ids: [...], action: "..." } or { id: "...", data: {...} }
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ids, markAllRead: allRead, action, data } = body;

    // Mark all as read
    if (allRead) {
      const success = await markAllAsRead(session.user.id as string);
      return NextResponse.json({ success });
    }

    // Bulk actions
    if (action && ids) {
      const parsed = bulkNotificationActionSchema.parse({ ids, action });
      let success = false;
      switch (parsed.action) {
        case "mark_read":
          success = await markAsRead(parsed.ids);
          break;
        case "mark_unread":
          success = await markAsUnread(parsed.ids);
          break;
        case "archive":
          success = await archiveNotifications(parsed.ids);
          break;
        case "unarchive":
          success = await archiveNotifications(parsed.ids, false);
          break;
        case "pin":
          success = await pinNotifications(parsed.ids);
          break;
        case "unpin":
          success = await pinNotifications(parsed.ids, false);
          break;
        case "delete":
          success = await deleteNotifications(parsed.ids);
          break;
      }
      return NextResponse.json({ success });
    }

    // Single notification update
    if (id) {
      const parsed = updateNotificationSchema.parse(data || {});

      if (parsed.read !== undefined) {
        await markAsRead(id);
      }
      if (parsed.archived !== undefined) {
        await archiveNotifications(id, parsed.archived);
      }
      if (parsed.pinned !== undefined) {
        await pinNotifications(id, parsed.pinned);
      }
      if (parsed.acknowledged !== undefined) {
        await acknowledgeNotification(id);
      }
      if (parsed.snoozedUntil !== undefined && parsed.snoozedUntil !== null) {
        await snoozeNotification(id, new Date(parsed.snoozedUntil));
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

// ─── DELETE /api/notifications ────────────────────────────────────────────
// Body: { ids: [...] } or { id: "..." }
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ids = body.ids || (body.id ? [body.id] : null);

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const success = await deleteNotifications(ids);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to delete notifications:", error);
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
  }
}
