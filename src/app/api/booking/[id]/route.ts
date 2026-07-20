import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { notifyMeetingCompleted } from "@/lib/notifications/event-handlers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (body.status === "CONFIRMED" && existing.status !== "CONFIRMED") {
      updateData.confirmedAt = new Date();
    }
    if (body.status === "COMPLETED" && existing.status !== "COMPLETED") {
      updateData.completedAt = new Date();
      notifyMeetingCompleted(existing.name, "Consultation", `/dashboard/calendar/appointments/${id}`).catch(() => {});
    }
    if (body.status === "CANCELLED" && existing.status !== "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = body.cancellationReason || null;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Failed to update appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
