import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getUnreadCount } from "@/lib/notifications/notification-service";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await getUnreadCount(session.user.id as string);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}
