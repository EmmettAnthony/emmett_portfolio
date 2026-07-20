import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { createCalendarEvent } from "@/lib/google-calendar";
import { ownerBookingNotification, clientConfirmation } from "@/lib/email-templates";
import { publicBookingSchema } from "@/lib/validations/calendar";
import { checkRateLimit } from "@/lib/security";
import { verifyTurnstile } from "@/lib/turnstile";
import { notifyAppointmentBooked } from "@/lib/notifications/event-handlers";

const OWNER_EMAIL = "emmettanthony998@gmail.com";

function getSenderEmail(): string {
  const se = process.env.SENDER_EMAIL;
  if (se && !se.endsWith("@gmail.com")) return se;
  return process.env.RESEND_DEFAULT_DOMAIN
    ? `noreply@${process.env.RESEND_DEFAULT_DOMAIN}`
    : "delivered@resend.dev";
}

function getFrom() {
  const senderEmail = getSenderEmail();
  return `Emmett Anthony <${senderEmail}>`;
}

async function sendEmails(body: {
  name: string; email: string; phone?: string; company?: string;
  preferredDate: string; preferredTime?: string; projectType?: string; message?: string;
  website?: string; country?: string; budget?: string; timeline?: string;
  preferredContactMethod?: string; appointmentId?: string;
}) {
  const resend = getResend();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emmettanthony.dev";

    const ownerHtml = ownerBookingNotification({
    name: body.name,
    email: body.email,
    phone: body.phone,
    company: body.company,
    preferredDate: body.preferredDate,
    preferredTime: body.preferredTime,
    projectType: body.projectType,
    message: body.message,
    website: body.website,
    country: body.country,
    budget: body.budget,
    timeline: body.timeline,
    preferredContactMethod: body.preferredContactMethod,
  });

  const clientHtml = clientConfirmation({
    name: body.name,
    preferredDate: body.preferredDate,
    preferredTime: body.preferredTime,
    siteUrl,
  });

  try {
    await resend.emails.send({
      from: getFrom(),
      to: [OWNER_EMAIL],
      replyTo: body.email,
      subject: `[Booking] Consultation request from ${body.name}`,
      html: ownerHtml,
    });
    await prisma.contactEmailLog.create({
      data: {
        type: "BOOKING_OWNER",
        to: OWNER_EMAIL,
        from: getFrom(),
        subject: `[Booking] Consultation request from ${body.name}`,
        status: "SUCCESS",
        appointmentId: body.appointmentId,
      },
    });
  } catch (err) {
    console.error("Failed to send owner email:", err);
    await prisma.contactEmailLog.create({
      data: {
        type: "BOOKING_OWNER",
        to: OWNER_EMAIL,
        from: getFrom(),
        subject: `[Booking] Consultation request from ${body.name}`,
        status: "FAILED",
        error: err instanceof Error ? err.message : "Unknown error",
        appointmentId: body.appointmentId,
      },
    });
  }

  try {
    await resend.emails.send({
      from: getFrom(),
      to: [body.email],
      subject: `Booking confirmed — ${body.name}`,
      html: clientHtml,
    });
    await prisma.contactEmailLog.create({
      data: {
        type: "BOOKING_AUTO_REPLY",
        to: body.email,
        from: getFrom(),
        subject: `Booking confirmed — ${body.name}`,
        status: "SUCCESS",
        appointmentId: body.appointmentId,
      },
    });
  } catch (err) {
    console.error("Failed to send client email:", err);
    await prisma.contactEmailLog.create({
      data: {
        type: "BOOKING_AUTO_REPLY",
        to: body.email,
        from: getFrom(),
        subject: `Booking confirmed — ${body.name}`,
        status: "FAILED",
        error: err instanceof Error ? err.message : "Unknown error",
        appointmentId: body.appointmentId,
      },
    });
  }
}

function toLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rl = checkRateLimit(`booking:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();

    if (!body.turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      return NextResponse.json({ error: "Security verification required. Please complete the captcha." }, { status: 400 });
    }

    if (body.turnstileToken) {
      const valid = await verifyTurnstile(body.turnstileToken);
      if (!valid) {
        return NextResponse.json({ error: "Security check failed. Please try again." }, { status: 400 });
      }
    }

    const parsed = publicBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, company, website, country, projectType, budget, timeline, projectDescription, preferredContactMethod, preferredDate, preferredTime, duration, timezone, fileUrl, fileName, newsletter, terms, meetingTypeId } = parsed.data;
    const name = `${firstName} ${lastName}`.trim();
    const message = projectDescription || null;
    const source = body.source || "WEBSITE";
    const contactId = body.contactId || null;

    const preferredDateLocal = toLocalDate(preferredDate);

    if (meetingTypeId) {
      const typeExists = await prisma.meetingType.findUnique({ where: { id: meetingTypeId }, select: { id: true } });
      if (!typeExists) {
        return NextResponse.json({ error: "Invalid meeting type" }, { status: 400 });
      }
    }

    const existingSlot = await prisma.appointment.findFirst({
      where: {
        preferredDate: preferredDateLocal,
preferredTime: preferredTime ?? undefined,
        status: { notIn: ["CANCELLED"] },
      },
      select: { id: true },
    });
    if (existingSlot) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please select a different time." },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        website: website || null,
        country: country || null,
        projectType: projectType || null,
        budget: budget || null,
        timeline: timeline || null,
        preferredDate: preferredDateLocal,
        preferredTime: preferredTime ?? null,
        duration: duration || 30,
        message: message || null,
        timezone: timezone || null,
        preferredContactMethod: preferredContactMethod || null,
        newsletter: newsletter || false,
        terms: terms || false,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        status: "PENDING",
        source,
        contactId,
        meetingTypeId: meetingTypeId || null,
      },
    });

    if (process.env.RESEND_API_KEY) {
      sendEmails({
        name, email, phone: phone || undefined, company: company || undefined,
        preferredDate, preferredTime: preferredTime || undefined, projectType: projectType || undefined,
        message: message || undefined, website: website || undefined, country: country || undefined,
        budget: budget || undefined, timeline: timeline || undefined,
        preferredContactMethod: preferredContactMethod || undefined,
        appointmentId: appointment.id,
      }).catch((err: Error) => console.error("Failed to send booking email(s):", err));
    }

    createCalendarEvent({
      summary: `Consultation: ${name}`,
      description: message || `Booking consultation with ${name}${company ? ` from ${company}` : ""}`,
      startDate: preferredDate,
      startTime: preferredTime || undefined,
      duration: duration,
      timezone: body.timezone || undefined,
      attendeeEmail: email,
    }).catch((err) => console.error("[Google Calendar] Error:", err));

    const meetingTypeName = body.meetingTypeId
      ? (await prisma.meetingType.findUnique({ where: { id: body.meetingTypeId }, select: { name: true } }))?.name || "Consultation"
      : "Consultation";
    notifyAppointmentBooked(name, email, preferredDate, meetingTypeName, `/dashboard/calendar/appointments/${appointment.id}`).catch(() => {});

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}