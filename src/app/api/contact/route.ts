import { NextResponse, NextRequest } from "next/server";
import { submitContact } from "@/actions/contact";
import { contactFormSchema } from "@/lib/validations/contact";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/security";
import { getResend } from "@/lib/resend";
import { contactNotification } from "@/lib/email-templates";
import { notifyNewContactSubmission } from "@/lib/notifications/event-handlers";
import { getSiteSettings } from "@/lib/get-site-settings";

function getSenderEmail(): string {
  const se = process.env.SENDER_EMAIL;
  if (se && !se.endsWith("@gmail.com")) return se;
  if (se && se.endsWith("@gmail.com")) {
    console.warn("SENDER_EMAIL is a Gmail address — Resend does not support Gmail senders. Falling back to RESEND_DEFAULT_DOMAIN or delivered@resend.dev.");
  }
  return process.env.RESEND_DEFAULT_DOMAIN
    ? `noreply@${process.env.RESEND_DEFAULT_DOMAIN}`
    : "delivered@resend.dev";
}

function getFrom() {
  return `Emmett Anthony <${getSenderEmail()}>`;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rl = checkRateLimit(`contact:${ip}`, { maxRequests: 3, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();

    if (body.turnstileToken) {
      const valid = await verifyTurnstile(body.turnstileToken);
      if (!valid) {
        return NextResponse.json({ error: "Security check failed. Please try again." }, { status: 400 });
      }
    }

    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, company, projectType, budget, timeline, subject, message, fileUrl, fileName } = parsed.data;

    const result = await submitContact({
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      projectType,
      budget: budget || undefined,
      timeline: timeline || undefined,
      subject,
      message,
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
    });

    if (process.env.RESEND_API_KEY) {
      try {
        const siteSettings = await getSiteSettings();
        const resend = getResend();
        await resend.emails.send({
          from: getFrom(),
          to: [siteSettings.email],
          replyTo: email,
          subject: `[Contact] ${subject}`,
          html: contactNotification({ name, email, phone: phone || null, company: company || null, subject, message }),
        });
        await resend.emails.send({
          from: getFrom(),
          to: [email],
          subject: "Thanks for reaching out!",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;border-radius:12px 12px 0 0;">
                <h1 style="color:white;margin:0;">Message Received!</h1>
              </div>
              <div style="padding:32px;background:white;border-radius:0 0 12px 12px;">
                <p style="font-size:16px;color:#333;">Hi ${name},</p>
                <p style="font-size:16px;color:#555;line-height:1.6;">
                  Thank you for reaching out! I've received your message and will get back to you within 24 hours.
                </p>
                <p style="font-size:16px;color:#555;line-height:1.6;">
                  In the meantime, feel free to <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://emmettanthony.dev"}/book" style="color:#2563eb;">book a call</a> if you'd like to chat sooner.
                </p>
                <p style="font-size:16px;color:#555;line-height:1.6;">
                  Best regards,<br /><strong>Emmett Anthony</strong>
                </p>
              </div>
            </div>
          `,
        });
      } catch (e) {
        console.error("Failed to send contact email(s):", e);
      }
    }

    notifyNewContactSubmission(name, email, projectType, `/dashboard/contact/submissions`).catch(() => {});

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
