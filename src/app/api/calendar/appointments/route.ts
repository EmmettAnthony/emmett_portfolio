import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { getResend } from "@/lib/resend";
import {
  createAppointmentSchema
} from "@/lib/validations/calendar";
import { rateLimit } from "@/lib/rate-limit";
import { appointmentConfirmationTemplate } from "@/lib/email/templates";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const meetingTypeId = searchParams.get("meetingTypeId");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));

    const prisma = getPrisma();
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (meetingTypeId) where.meetingTypeId = meetingTypeId;
    if (startDate) where.preferredDate = { gte: new Date(startDate) };
    if (endDate) where.preferredDate = { ...((where.preferredDate as Record<string, unknown>) || {}), lte: new Date(endDate) };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { preferredDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { meetingType: true, appointmentLogs: { orderBy: { createdAt: "desc" }, take: 5 } },
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({ appointments, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    captureError(error, "Failed to fetch appointments");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // Public booking endpoint - rate limit
  const session = await auth();
  if (!session) {
    const { success: allowed } = await rateLimit(`booking:${ip}`, 3, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  try {
    const body = await request.json();
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();

    // Conflict detection: check for overlapping appointments
    const dateStart = new Date(data.preferredDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(data.preferredDate);
    dateEnd.setHours(23, 59, 59, 999);

    const existingCount = await prisma.appointment.count({
      where: {
        preferredDate: { gte: dateStart, lte: dateEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });

    const availability = await prisma.availability.findFirst({
      where: { dayOfWeek: dateStart.getDay(), isActive: true },
    });

    const maxSlotsPerDay = availability
      ? Math.floor(
          ((parseInt(availability.endTime.split(":")[0]) * 60 + parseInt(availability.endTime.split(":")[1])) -
            (parseInt(availability.startTime.split(":")[0]) * 60 + parseInt(availability.startTime.split(":")[1]))) /
            data.duration
        )
      : 8;

    if (existingCount >= maxSlotsPerDay) {
      return NextResponse.json({ error: "No available time slots on this date" }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        projectType: data.projectType,
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        duration: data.duration,
        message: data.message,
        notes: data.notes,
        status: session ? (data.status || "PENDING") : "PENDING",
        source: session ? "DASHBOARD" : "WEBSITE",
        timezone: data.timezone,
        meetingTypeId: data.meetingTypeId,
        contactId: data.contactId,
        projectId: data.projectId,
        clientId: data.clientId,
      },
      include: { meetingType: true },
    });

    // Create activity log
    await prisma.appointmentLog.create({
      data: {
        appointmentId: appointment.id,
        action: "CREATED",
        detail: `Appointment created by ${session ? "admin" : data.name}`,
        ip,
      },
    });

    // Create calendar event for the appointment
    const eventStart = new Date(data.preferredDate);
    if (data.preferredTime) {
      const [hours, minutes] = data.preferredTime.split(":").map(Number);
      eventStart.setHours(hours, minutes, 0, 0);
    }
    const eventEnd = new Date(eventStart.getTime() + data.duration * 60 * 1000);

    await prisma.calendarEvent.create({
      data: {
        title: `Appointment: ${data.name}`,
        description: data.message || null,
        startDate: eventStart,
        endDate: eventEnd,
        eventType: "CONSULTATION",
        status: "SCHEDULED",
        color: "#10b981",
        appointmentId: appointment.id,
      },
    });

    // Send confirmation email using the new template
    if (!session) {
      try {
        const resend = getResend();
        const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
        const meetingType = appointment.meetingType?.name || null;

        const { subject, html } = appointmentConfirmationTemplate({
          name: data.name,
          date: data.preferredDate,
          time: data.preferredTime,
          duration: data.duration,
          meetingType,
          message: data.message,
          timezone: data.timezone,
        });

        await resend.emails.send({
          from: `Emmett Anthony <${senderEmail}>`,
          to: data.email,
          subject,
          html,
        });
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    captureError(error, "Failed to create appointment");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
