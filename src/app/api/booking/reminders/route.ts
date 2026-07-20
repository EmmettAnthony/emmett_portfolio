import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { escapeHtml, formatTime } from "@/lib/utils/string-guards";

function getSenderEmail(): string {
  const se = process.env.SENDER_EMAIL;
  if (se && !se.endsWith("@gmail.com")) return se;
  return process.env.RESEND_DEFAULT_DOMAIN
    ? `noreply@${process.env.RESEND_DEFAULT_DOMAIN}`
    : "delivered@resend.dev";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export async function GET() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const pendingReminders = await prisma.appointment.count({
      where: {
        status: "CONFIRMED",
        reminderSent: false,
        preferredDate: { gte: now, lte: tomorrow },
      },
    });

    const upcoming = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        reminderSent: false,
        preferredDate: { gte: now, lte: tomorrow },
      },
      orderBy: { preferredDate: "asc" },
      take: 20,
    });

    const sentToday = await prisma.contactEmailLog.count({
      where: {
        type: "BOOKING_REMINDER",
        createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
      },
    });

    const recentLogs = await prisma.contactEmailLog.findMany({
      where: { type: "BOOKING_REMINDER" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ pendingReminders, upcoming, sentToday, recentLogs });
  } catch (error) {
    console.error("Failed to fetch reminder data:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder data" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const resend = getResend();
  const senderEmail = getSenderEmail();
  const from = `Emmett Anthony <${senderEmail}>`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emmettanthony.dev";

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      reminderSent: false,
      preferredDate: { gte: now, lte: tomorrow },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const apt of appointments) {
    // Skip appointments with no email address
    if (!apt.email) continue;

    try {
      const dateStr = formatDate(apt.preferredDate);
      const timeStr = formatTime(apt.preferredTime);

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">Reminder: Your Consultation is Tomorrow</h1>
          </div>
          <div style="padding:32px;background:white;border-radius:0 0 12px 12px;">
            <p style="font-size:16px;color:#333;line-height:1.6;">Hi ${escapeHtml(apt.name)},</p>
            <p style="font-size:16px;color:#555;line-height:1.6;">
              This is a friendly reminder about your upcoming consultation with <strong>Emmett Anthony</strong>.
            </p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
              <p style="margin:0 0 8px;font-size:14px;color:#64748b;"><strong>Date:</strong> ${dateStr}</p>
              ${timeStr ? `<p style="margin:0 0 8px;font-size:14px;color:#64748b;"><strong>Time:</strong> ${timeStr}</p>` : ""}
              ${apt.duration ? `<p style="margin:0;font-size:14px;color:#64748b;"><strong>Duration:</strong> ${apt.duration} minutes</p>` : ""}
            </div>
            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:24px;margin:24px 0;">
              <h3 style="margin:0 0 12px;font-size:14px;color:#0369a1;">What to Expect</h3>
              <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
                <li>We'll discuss your project goals and requirements</li>
                <li>I'll answer any questions you have about the process</li>
                <li>We'll outline next steps and timelines</li>
              </ul>
            </div>
            <p style="font-size:14px;color:#64748b;line-height:1.6;">
              Need to reschedule or cancel?
              <a href="${siteUrl}/booking?reschedule=${apt.id}" style="color:#2563eb;">Click here</a> to manage your appointment.
            </p>
            <p style="font-size:16px;color:#555;line-height:1.6;margin-top:24px;">
              Best regards,<br /><strong>Emmett Anthony</strong>
            </p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from,
        to: [apt.email],
        subject: "Reminder: Your consultation with Emmett Anthony is tomorrow",
        html,
      });

      await prisma.appointment.update({
        where: { id: apt.id },
        data: { reminderSent: true },
      });

      await prisma.contactEmailLog.create({
        data: {
          type: "BOOKING_REMINDER",
          to: apt.email,
          from,
          subject: "Reminder: Your consultation with Emmett Anthony is tomorrow",
          status: "SUCCESS",
          appointmentId: apt.id,
        },
      });

      sent++;
    } catch (err) {
      errors++;
      console.error(`Failed to send reminder for appointment ${apt.id}:`, err);

      await prisma.contactEmailLog.create({
        data: {
          type: "BOOKING_REMINDER",
          to: apt.email,
          from,
          subject: "Reminder: Your consultation with Emmett Anthony is tomorrow",
          status: "FAILED",
          error: err instanceof Error ? err.message : "Unknown error",
          appointmentId: apt.id,
        },
      });
    }
  }

  return NextResponse.json({ sent, errors });
}
