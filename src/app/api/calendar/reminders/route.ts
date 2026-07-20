import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import {
  createReminderSchema
} from "@/lib/validations/calendar";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const remindType = searchParams.get("remindType");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const prisma = getPrisma();
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (remindType) where.remindType = remindType;

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        orderBy: { remindAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reminder.count({ where }),
    ]);

    return NextResponse.json({ reminders, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    captureError(error, "Failed to fetch reminders");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createReminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();

    const reminder = await prisma.reminder.create({
      data: {
        title: data.title,
        description: data.description,
        remindAt: new Date(data.remindAt),
        remindType: data.remindType,
        status: data.status,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        repeatInterval: data.repeatInterval,
        repeatUntil: data.repeatUntil ? new Date(data.repeatUntil) : null,
      },
    });

    // Create calendar event for the reminder
    await prisma.calendarEvent.create({
      data: {
        title: `Reminder: ${data.title}`,
        description: data.description,
        startDate: new Date(data.remindAt),
        allDay: false,
        eventType: "REMINDER",
        status: "SCHEDULED",
        color: "#f59e0b",
        reminderId: reminder.id,
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    captureError(error, "Failed to create reminder");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
