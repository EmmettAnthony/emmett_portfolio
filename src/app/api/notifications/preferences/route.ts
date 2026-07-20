import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications";
import { updateNotificationPreferencesSchema } from "@/lib/validations/notifications";

// ─── GET /api/notifications/preferences ───────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await getNotificationPreferences(session.user.id as string);
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Failed to fetch notification preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// ─── PATCH /api/notifications/preferences ─────────────────────────────────
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateNotificationPreferencesSchema.parse(body);

    const success = await updateNotificationPreferences(
      session.user.id as string,
      parsed as Record<string, unknown>
    );

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
