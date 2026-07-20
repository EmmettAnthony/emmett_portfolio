import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import {
  getNotificationTemplates,
  upsertNotificationTemplate,
  deleteNotificationTemplate,
} from "@/lib/notifications";
import {
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
} from "@/lib/validations/notifications";

// ─── GET /api/notifications/templates ─────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await getNotificationTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch notification templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

// ─── POST /api/notifications/templates ────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createNotificationTemplateSchema.parse(body);
    const success = await upsertNotificationTemplate(parsed as unknown as Record<string, unknown>);

    return NextResponse.json({ success }, { status: success ? 201 : 500 });
  } catch (error) {
    console.error("Failed to create notification template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

// ─── PATCH /api/notifications/templates ───────────────────────────────────
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const parsed = updateNotificationTemplateSchema.parse(data);
    const success = await upsertNotificationTemplate(
      parsed as unknown as Record<string, unknown>,
      id
    );

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to update notification template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

// ─── DELETE /api/notifications/templates ──────────────────────────────────
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const success = await deleteNotificationTemplate(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to delete notification template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
