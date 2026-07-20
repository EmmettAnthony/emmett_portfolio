import { formatTime } from "@/lib/utils/string-guards";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev";
const SENDER_NAME = "Emmett Anthony";

function formatDate(date: Date | string, time?: string | null): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  if (time) {
    return `${dateStr} at ${formatTime(time)}`;
  }
  return dateStr;
}

function wrapTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">${title}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">${SENDER_NAME} — Professional Software Developer</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e5e7eb;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align:center;">
                <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                  <strong style="color:#111827;">${SENDER_NAME}</strong> · Professional Software Developer
                </p>
                <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;">
                  ${SITE_URL}
                </p>
                <p style="margin:0;font-size:11px;color:#9ca3af;">
                  This is an automated message from your scheduling system.<br />
                  If you have questions, reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Appointment Confirmation ─────────────────────────────────────────────────

export function appointmentConfirmationTemplate(params: {
  name: string;
  date: Date | string;
  time?: string | null;
  duration: number;
  meetingType?: string | null;
  message?: string | null;
  location?: string | null;
  timezone?: string | null;
}): { subject: string; html: string } {
  const subject = "Consultation Booking Confirmed";
  const html = wrapTemplate(
    "Booking Confirmed! 🎉",
    `
    <p style="margin:0 0 20px;color:#111827;font-size:16px;line-height:1.7;">Hi ${params.name},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      Great news — your consultation has been <strong style="color:#111827;">confirmed</strong>! 
      I'm looking forward to connecting with you. Here's a summary of your booking:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-collapse:collapse;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:8px 8px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${params.meetingType ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">Meeting Type</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${params.meetingType}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">Date</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${formatDate(params.date, params.time)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;">Duration</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${params.duration} minutes</td>
          </tr>
          ${params.timezone ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;">Timezone</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${params.timezone}</td>
          </tr>` : ""}
          ${params.location ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;">Location</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${params.location}</td>
          </tr>` : ""}
        </table>
      </td></tr>
    </table>

    ${params.message ? `
    <div style="margin-bottom:20px;padding:16px;background:#f0f9ff;border-radius:8px;border-left:3px solid #3b82f6;">
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Message</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;font-style:italic;">"${params.message}"</p>
    </div>` : ""}

    <div style="margin-bottom:24px;padding:16px;background:#f0fdf4;border-radius:8px;border-left:3px solid #10b981;">
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Next Steps</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
        I'll send a reminder before our meeting. If you need to reschedule or cancel, 
        please reply to this email or visit the booking page.
      </p>
    </div>

    <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
      Best regards,<br />
      <strong style="color:#111827;">${SENDER_NAME}</strong>
    </p>`
  );
  return { subject, html };
}

// ─── Appointment Reminder ─────────────────────────────────────────────────────

export function appointmentReminderTemplate(params: {
  name: string;
  date: Date | string;
  time?: string | null;
  duration: number;
  meetingType?: string | null;
  location?: string | null;
  timezone?: string | null;
}): { subject: string; html: string } {
  const subject = "Reminder: Your consultation is tomorrow";
  const html = wrapTemplate(
    "Upcoming Meeting Reminder ⏰",
    `
    <p style="margin:0 0 20px;color:#111827;font-size:16px;line-height:1.7;">Hi ${params.name},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      This is a friendly reminder about your upcoming consultation. Here are the details:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-collapse:collapse;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:8px 8px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${params.meetingType ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">Meeting Type</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${params.meetingType}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">Date</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${formatDate(params.date, params.time)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;">Duration</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${params.duration} minutes</td>
          </tr>
          ${params.location ? `<tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;">Location</td>
            <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${params.location}</td>
          </tr>` : ""}
        </table>
      </td></tr>
    </table>

    <div style="margin-bottom:24px;padding:16px;background:#fefce8;border-radius:8px;border-left:3px solid #eab308;">
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Preparation Tips</p>
      <ul style="margin:4px 0 0;padding-left:16px;color:#374151;font-size:14px;line-height:1.6;">
        <li>Have any relevant project details or questions ready</li>
        <li>Ensure a stable internet connection if joining virtually</li>
        <li>Feel free to share any materials ahead of time</li>
      </ul>
    </div>

    <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
      See you soon!<br />
      <strong style="color:#111827;">${SENDER_NAME}</strong>
    </p>`
  );
  return { subject, html };
}

// ─── Appointment Rescheduled ──────────────────────────────────────────────────

export function appointmentRescheduledTemplate(params: {
  name: string;
  oldDate: Date | string;
  oldTime?: string | null;
  newDate: Date | string;
  newTime?: string | null;
  duration: number;
  meetingType?: string | null;
  reason?: string | null;
}): { subject: string; html: string } {
  const subject = "Appointment Rescheduled";
  const html = wrapTemplate(
    "Appointment Rescheduled 📅",
    `
    <p style="margin:0 0 20px;color:#111827;font-size:16px;line-height:1.7;">Hi ${params.name},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      Your appointment has been <strong style="color:#111827;">rescheduled</strong>.
    </p>

    ${params.reason ? `
    <div style="margin-bottom:20px;padding:12px 16px;background:#f9fafb;border-radius:8px;">
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${params.reason}</p>
    </div>` : ""}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;width:50%;border-radius:8px 0 0 8px;border-right:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;font-size:11px;color:#ef4444;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Previously</p>
          <p style="margin:0;color:#6b7280;font-size:14px;">${formatDate(params.oldDate, params.oldTime)}</p>
        </td>
        <td style="padding:12px 16px;background:#f9fafb;width:50%;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px;font-size:11px;color:#10b981;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">New Date</p>
          <p style="margin:0;color:#111827;font-size:14px;font-weight:500;">${formatDate(params.newDate, params.newTime)}</p>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:6px 16px;color:#6b7280;font-size:13px;">
          Duration: ${params.duration} minutes ${params.meetingType ? `· ${params.meetingType}` : ""}
        </td>
      </tr>
    </table>

    <div style="margin-bottom:20px;padding:16px;background:#f0f9ff;border-radius:8px;border-left:3px solid #3b82f6;">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
        If the new time doesn't work for you, please reply to this email and I'll be happy to find a better slot.
      </p>
    </div>

    <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
      Best regards,<br />
      <strong style="color:#111827;">${SENDER_NAME}</strong>
    </p>`
  );
  return { subject, html };
}

// ─── Appointment Cancelled ─────────────────────────────────────────────────────

export function appointmentCancelledTemplate(params: {
  name: string;
  date: Date | string;
  time?: string | null;
  meetingType?: string | null;
  reason?: string | null;
}): { subject: string; html: string } {
  const subject = "Appointment Cancelled";
  const html = wrapTemplate(
    "Appointment Cancelled ❌",
    `
    <p style="margin:0 0 20px;color:#111827;font-size:16px;line-height:1.7;">Hi ${params.name},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      Your appointment scheduled for <strong style="color:#111827;">${formatDate(params.date, params.time)}</strong> 
      has been <strong style="color:#ef4444;">cancelled</strong>.
    </p>

    ${params.reason ? `
    <div style="margin-bottom:24px;padding:16px;background:#fef2f2;border-radius:8px;border-left:3px solid #ef4444;">
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${params.reason}</p>
    </div>` : ""}

    <div style="margin-bottom:24px;padding:16px;background:#f9fafb;border-radius:8px;">
      <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
        If you'd like to reschedule, you can book a new time at any time:
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="padding:12px 24px;background:#111827;border-radius:8px;text-align:center;">
          <a href="${SITE_URL}/book-consultation" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            Book a New Consultation
          </a>
        </td></tr>
      </table>
    </div>

    <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
      I hope we can connect another time!<br />
      <strong style="color:#111827;">${SENDER_NAME}</strong>
    </p>`
  );
  return { subject, html };
}

// ─── Custom Reminder Email ────────────────────────────────────────────────────

export function customReminderTemplate(params: {
  title: string;
  description?: string | null;
  remindAt: Date | string;
  relatedType?: string | null;
}): { subject: string; html: string } {
  const subject = `Reminder: ${params.title}`;
  const html = wrapTemplate(
    "Reminder 🔔",
    `
    <p style="margin:0 0 20px;color:#111827;font-size:16px;line-height:1.7;">Hi there,</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      This is a reminder for:
    </p>

    <div style="margin-bottom:24px;padding:20px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;">${params.title}</h2>
      ${params.relatedType ? `<p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${params.relatedType}</p>` : ""}
      ${params.description ? `<p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${params.description}</p>` : ""}
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280;">
        ${new Date(params.remindAt).toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit"
        })}
      </p>
    </div>

    <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
      Best,<br />
      <strong style="color:#111827;">${SENDER_NAME}</strong>
    </p>`
  );
  return { subject, html };
}
