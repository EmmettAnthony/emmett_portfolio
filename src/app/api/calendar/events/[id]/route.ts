import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { updateEventSchema } from "@/lib/validations/calendar";
import { exportEvent, deleteEvent } from "@/lib/calendar/google";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: { meetingType: true, appointment: true, task: true, reminder: true },
    });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ event });
  } catch (error) {
    captureError(error, "Failed to fetch event");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();

    // Fetch existing event before update to get metadata for Google sync
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.link !== undefined && { link: data.link }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.eventType !== undefined && { eventType: data.eventType }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.attachments !== undefined && { attachments: data.attachments }),
        ...(data.recurring !== undefined && { recurring: data.recurring }),
        ...(data.meetingTypeId !== undefined && { meetingTypeId: data.meetingTypeId }),
      },
      include: { meetingType: true, appointment: true, task: true, reminder: true },
    });

    // Auto-export update to Google Calendar if connected
    if (existing) {
      const existingMetadata = existing.metadata as Record<string, unknown> | null;
      await exportEvent({
        ...event,
        metadata: { ...(existingMetadata || {}), googleEventId: existingMetadata?.googleEventId as string | undefined },
      });
    }

    return NextResponse.json({ event });
  } catch (error) {
    captureError(error, "Failed to update event");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();

    // Fetch event before deleting to get Google event ID
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });

    await prisma.calendarEvent.delete({ where: { id } });

    // Auto-delete from Google Calendar if previously synced
    if (existing) {
      const metadata = existing.metadata as Record<string, unknown> | null;
      const googleEventId = metadata?.googleEventId as string | undefined;
      if (googleEventId) {
        deleteEvent(googleEventId).catch((err) =>
          console.error("Failed to delete event from Google Calendar:", err)
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureError(error, "Failed to delete event");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
