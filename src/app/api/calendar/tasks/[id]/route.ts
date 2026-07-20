import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { updateTaskSchema } from "@/lib/validations/calendar";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const task = await prisma.calendarTask.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    captureError(error, "Failed to fetch task");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();

    const taskData: Record<string, unknown> = {};
    if (data.title !== undefined) taskData.title = data.title;
    if (data.description !== undefined) taskData.description = data.description;
    if (data.dueDate !== undefined) taskData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.priority !== undefined) taskData.priority = data.priority;
    if (data.status !== undefined) {
      taskData.status = data.status;
      if (data.status === "COMPLETED") taskData.completedAt = new Date();
    }
    if (data.progress !== undefined) taskData.progress = data.progress;
    if (data.category !== undefined) taskData.category = data.category;
    if (data.tags !== undefined) taskData.tags = data.tags;
    if (data.order !== undefined) taskData.order = data.order;
    if (data.color !== undefined) taskData.color = data.color;

    const task = await prisma.calendarTask.update({ where: { id }, data: taskData });

    // Sync calendar event
    if (data.status === "COMPLETED" || data.status === "PENDING" || data.status === "IN_PROGRESS") {
      const existingEvent = await prisma.calendarEvent.findFirst({ where: { taskId: id } });
      if (existingEvent && data.status === "COMPLETED") {
        await prisma.calendarEvent.update({ where: { id: existingEvent.id }, data: { status: "COMPLETED" } });
      } else if (existingEvent && data.status !== "COMPLETED") {
        await prisma.calendarEvent.update({ where: { id: existingEvent.id }, data: { status: "SCHEDULED" } });
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    captureError(error, "Failed to update task");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    // Also clean up related calendar events
    await prisma.calendarEvent.deleteMany({ where: { taskId: id } });
    await prisma.calendarTask.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureError(error, "Failed to delete task");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
