import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { getResend } from "@/lib/resend";
import { updateAppointmentSchema } from "@/lib/validations/calendar";
import { appointmentConfirmationTemplate, appointmentCancelledTemplate, appointmentRescheduledTemplate } from "@/lib/email/templates";
import { notifyAppointmentRescheduled, notifyAppointmentCancelled, notifyMeetingCompleted } from "@/lib/notifications/event-handlers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        meetingType: true,
        contact: true,
        project: true,
        client: true,
        appointmentLogs: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ appointment });
  } catch (error) {
    captureError(error, "Failed to fetch appointment");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.projectType !== undefined && { projectType: data.projectType }),
        ...(data.preferredDate !== undefined && { preferredDate: new Date(data.preferredDate) }),
        ...(data.preferredTime !== undefined && { preferredTime: data.preferredTime }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.message !== undefined && { message: data.message }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.meetingTypeId !== undefined && { meetingTypeId: data.meetingTypeId }),
        ...(data.contactId !== undefined && { contactId: data.contactId }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.clientId !== undefined && { clientId: data.clientId }),
        ...(data.cancellationReason !== undefined && { cancellationReason: data.cancellationReason }),
        ...(data.status !== undefined && {
          status: data.status,
          ...(data.status === "CONFIRMED" && { confirmedAt: new Date() }),
          ...(data.status === "CANCELLED" && { cancelledAt: new Date() }),
          ...(data.status === "COMPLETED" && { completedAt: new Date() }),
          ...(data.status === "RESCHEDULED" && { rescheduleCount: { increment: 1 } }),
        }),
      },
      include: { meetingType: true },
    });

    // Log the action
    let action = "UPDATED";
    if (data.status === "CONFIRMED") action = "CONFIRMED";
    else if (data.status === "CANCELLED") action = "CANCELLED";
    else if (data.status === "COMPLETED") action = "COMPLETED";
    else if (data.status === "RESCHEDULED") action = "RESCHEDULED";
    else if (data.status === "NO_SHOW") action = "NO_SHOW";

    await prisma.appointmentLog.create({
      data: { appointmentId: id, action, detail: `Status changed to ${data.status || "updated"}` },
    });

    // Fire notification events for status changes
    if (data.status === "CANCELLED") {
      const cancelDate = existing.preferredDate?.toLocaleDateString() || "unknown";
      notifyAppointmentCancelled(
        existing.name,
        cancelDate,
        data.cancellationReason || "No reason provided",
        `/dashboard/calendar/appointments/${id}`
      ).catch(() => {});
    } else if (data.status === "RESCHEDULED") {
      const oldDateStr = existing.preferredDate?.toLocaleDateString() || "unknown";
      const newDateStr = appointment.preferredDate?.toLocaleDateString() || "unknown";
      notifyAppointmentRescheduled(
        existing.name,
        existing.email,
        oldDateStr,
        newDateStr,
        `/dashboard/calendar/appointments/${id}`
      ).catch(() => {});
    } else if (data.status === "COMPLETED") {
      const meetingType = appointment.meetingType?.name || "Consultation";
      notifyMeetingCompleted(
        existing.name,
        meetingType,
        `/dashboard/calendar/appointments/${id}`
      ).catch(() => {});
    }

    // Send email notifications for status changes using the new templates
    if (data.status && ["CONFIRMED", "CANCELLED", "RESCHEDULED"].includes(data.status)) {
      try {
        const resend = getResend();
        const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
        const meetingType = appointment.meetingType?.name || null;

        let template: { subject: string; html: string } | null = null;

        if (data.status === "CONFIRMED") {
          template = appointmentConfirmationTemplate({
            name: appointment.name,
            date: appointment.preferredDate,
            time: appointment.preferredTime,
            duration: appointment.duration,
            meetingType,
            timezone: appointment.timezone,
          });
        } else if (data.status === "CANCELLED") {
          template = appointmentCancelledTemplate({
            name: appointment.name,
            date: appointment.preferredDate,
            time: appointment.preferredTime,
            meetingType,
            reason: data.cancellationReason,
          });
        } else if (data.status === "RESCHEDULED") {
          template = appointmentRescheduledTemplate({
            name: appointment.name,
            oldDate: existing.preferredDate,
            oldTime: existing.preferredTime,
            newDate: appointment.preferredDate,
            newTime: appointment.preferredTime,
            duration: appointment.duration,
            meetingType,
            reason: data.cancellationReason,
          });
        }

        if (template && appointment.email) {
          await resend.emails.send({
            from: `Emmett Anthony <${senderEmail}>`,
            to: appointment.email,
            subject: template.subject,
            html: template.html,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send status email:", emailErr);
      }
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    captureError(error, "Failed to update appointment");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureError(error, "Failed to delete appointment");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
