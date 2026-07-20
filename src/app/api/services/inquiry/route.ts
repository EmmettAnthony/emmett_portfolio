import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { createServiceInquirySchema } from "@/lib/validations/services";
import { getResend } from "@/lib/resend";
import { escapeHtml } from "@/lib/utils/string-guards";
import { notifyServiceInquiry } from "@/lib/notifications/event-handlers";

export async function POST(request: Request) {
  try {
    // Rate limit: 5 per minute per IP
    const { success: allowed } = await rateLimit(
      `service-inquiry:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`,
      5,
      60_000,
    );

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = createServiceInquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If serviceId is provided, verify the service exists and is published
    if (data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId, published: true },
      });
      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 }
        );
      }
    }

    const inquiry = await prisma.serviceInquiry.create({
      data: {
        serviceId: data.serviceId ?? null,
        serviceName: data.serviceName ?? null,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        company: data.company ?? null,
        budget: data.budget ?? null,
        message: data.message,
        status: "NEW",
      },
    });

    const safe = (val: string | null | undefined) => escapeHtml(val || "");

    try {
      const resend = getResend();
      const senderEmail = process.env.SENDER_EMAIL || "emmettanthony998@gmail.com";
      const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      await resend.emails.send({
        from: senderEmail,
        to: "emmettanthony998@gmail.com",
        replyTo: data.email,
        subject: `[Service Inquiry] ${data.serviceName || "General"} — ${data.fullName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
              <tr><td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                  <tr><td style="background:#111827;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">New Service Inquiry</h1>
                  </td></tr>
                  <tr><td style="padding:32px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      ${[
                        ["Full Name", safe(data.fullName)],
                        ["Email", safe(data.email)],
                        ["Phone", safe(data.phone)],
                        ["Company", safe(data.company)],
                        ["Budget", safe(data.budget)],
                        ["Service", safe(data.serviceName)],
                        ["Message", safe(data.message)],
                      ].map(([label, value]) => `
                        <tr>
                          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:500;width:120px;vertical-align:top;">${label}</td>
                          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${value}</td>
                        </tr>
                      `).join("")}
                    </table>
                    <div style="margin-top:24px;text-align:center;">
                      <a href="${siteUrl}/dashboard/services/inquiries" style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">View in Dashboard</a>
                    </div>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      });

      await resend.emails.send({
        from: senderEmail,
        to: data.email,
        subject: `Thank you for your inquiry — ${data.fullName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
              <tr><td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                  <tr><td style="background:#111827;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Thank You</h1>
                  </td></tr>
                  <tr><td style="padding:32px 40px;">
                    <p style="margin:0 0 16px;color:#111827;font-size:16px;line-height:1.6;">Dear ${safe(data.fullName)},</p>
                    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                      Thank you for reaching out! I have received your inquiry regarding
                      <strong>${safe(data.serviceName || "our services")}</strong> and appreciate your interest.
                    </p>
                    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                      I typically review inquiries within <strong>24–48 hours</strong> and will get back to you
                      as soon as possible. If you have any urgent questions, feel free to reply directly to this email.
                    </p>
                    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                      In the meantime, you are welcome to browse my portfolio for examples of my work.
                    </p>
                    <div style="text-align:center;">
                      <a href="${siteUrl}/portfolio" style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">View Portfolio</a>
                    </div>
                    <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;">
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
                      Best regards,<br>
                      <strong>Emmett Anthony</strong>
                    </p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send inquiry email(s):", emailErr);
    }

    notifyServiceInquiry(data.fullName, data.email, data.serviceName || "General", `/dashboard/services/inquiries`).catch(() => {});

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit service inquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}
