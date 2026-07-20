import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import {
  createEventSchema
} from "@/lib/validations/calendar";
import { exportEvent } from "@/lib/calendar/google";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventType = searchParams.get("eventType");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const prisma = getPrisma();
    const where: Record<string, unknown> = {};

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.endDate = { ...(where.endDate || {}), lte: new Date(endDate) };
    }
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        orderBy: { startDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          meetingType: true,
          appointment: true,
          task: true,
          reminder: true,
        },
      }),
      prisma.calendarEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: { page, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    captureError(error, "Failed to fetch events");
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const prisma = getPrisma();

    const event = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        allDay: data.allDay,
        location: data.location,
        link: data.link,
        color: data.color,
        eventType: data.eventType,
        status: data.status,
        priority: data.priority,
        notes: data.notes,
        attachments: data.attachments,
        recurring: data.recurring,
        meetingTypeId: data.meetingTypeId,
        appointmentId: data.appointmentId,
        taskId: data.taskId,
        reminderId: data.reminderId,
      },
      include: {
        meetingType: true,
        appointment: true,
        task: true,
        reminder: true,
      },
    });

    // Auto-export to Google Calendar if connected
    const googleEventId = await exportEvent({
      ...event,
      metadata: event.metadata as Record<string, unknown> | null,
    });
    if (googleEventId) {
      // Store the Google event ID in metadata
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: {
          metadata: { googleEventId },
        },
      });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    captureError(error, "Failed to create event");
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
