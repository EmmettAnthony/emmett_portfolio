import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { checkRateLimit } from "@/lib/security";
import { hasRecipient } from "@/lib/utils/string-guards";

function getSenderEmail(): string {
  const se = process.env.SENDER_EMAIL;
  if (se && !se.endsWith("@gmail.com")) return se;
  return process.env.RESEND_DEFAULT_DOMAIN
    ? `noreply@${process.env.RESEND_DEFAULT_DOMAIN}`
    : "delivered@resend.dev";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rl = checkRateLimit(`cancel:${ip}`, { maxRequests: 3, windowMs: 300_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason, email } = body;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (email && appointment.email !== email) {
      return NextResponse.json({ error: "Email does not match the appointment" }, { status: 403 });
    }

    if (appointment.status === "CANCELLED") {
      return NextResponse.json({ error: "Appointment is already cancelled" }, { status: 400 });
    }

    if (appointment.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot cancel a completed appointment" }, { status: 400 });
    }

    await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason || null,
      },
    });

    if (hasRecipient(appointment.email)) {
      try {
        const resend = getResend();
        const from = `Emmett Anthony <${getSenderEmail()}>`;

        await resend.emails.send({
          from,
          to: [appointment.email],
          subject: "Appointment Cancelled",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">Appointment Cancelled</h1>
              </div>
              <div style="padding:32px;background:white;border-radius:0 0 12px 12px;">
                <p style="font-size:16px;color:#333;">Hi ${appointment.name},</p>
                <p style="font-size:16px;color:#555;line-height:1.6;">
                  Your appointment on <strong>${new Date(appointment.preferredDate).toLocaleDateString()}</strong>${appointment.preferredTime ? ` at <strong>${appointment.preferredTime}</strong>` : ""} has been cancelled.
                </p>
                ${reason ? `<p style="font-size:14px;color:#64748b;background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;"><strong>Reason:</strong> ${reason}</p>` : ""}
                <p style="font-size:16px;color:#555;line-height:1.6;">
                  If you'd like to reschedule, <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://emmettanthony.dev"}/book" style="color:#2563eb;">click here</a>.
                </p>
              </div>
            </div>
          `,
        });
      } catch (e) {
        console.error("Failed to send cancellation email:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
