import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { updateReminderSchema } from "@/lib/validations/calendar";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ reminder });
  } catch (error) {
    captureError(error, "Failed to fetch reminder");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.remindAt !== undefined) updateData.remindAt = new Date(data.remindAt);
    if (data.remindType !== undefined) updateData.remindType = data.remindType;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "SENT") updateData.sentAt = new Date();
    }
    if (data.relatedType !== undefined) updateData.relatedType = data.relatedType;
    if (data.relatedId !== undefined) updateData.relatedId = data.relatedId;
    if (data.repeatInterval !== undefined) updateData.repeatInterval = data.repeatInterval;
    if (data.repeatUntil !== undefined) updateData.repeatUntil = data.repeatUntil ? new Date(data.repeatUntil) : null;

    const reminder = await prisma.reminder.update({ where: { id }, data: updateData });

    // Sync calendar event
    if (data.status === "SENT" || data.status === "DISMISSED") {
      const existingEvent = await prisma.calendarEvent.findFirst({ where: { reminderId: id } });
      if (existingEvent) {
        await prisma.calendarEvent.update({
          where: { id: existingEvent.id },
          data: { status: data.status === "SENT" ? "COMPLETED" : "CANCELLED" },
        });
      }
    }

    return NextResponse.json({ reminder });
  } catch (error) {
    captureError(error, "Failed to update reminder");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.calendarEvent.deleteMany({ where: { reminderId: id } });
    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureError(error, "Failed to delete reminder");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
