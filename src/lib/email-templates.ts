import { escapeHtml, safe, safeVal, formatTime } from "@/lib/utils/string-guards";

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

const brandColor = "#2563eb";
const accentColor = "#7c3aed";

function wrapper(content: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      ${content}
    </div>
  `;
}

function header(title: string, subtitle?: string): string {
  return `
    <div style="background:linear-gradient(135deg,${brandColor},${accentColor});padding:32px;border-radius:12px 12px 0 0;${subtitle ? "" : "text-align:center;"}">
      <h1 style="color:white;margin:0;font-size:24px;">${escapeHtml(title)}</h1>
      ${subtitle ? `<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">${escapeHtml(subtitle)}</p>` : ""}
    </div>
  `;
}

function detailTable(rows: [string, string | null][]): string {
  const filtered = rows.filter(([, v]) => v !== null);
  if (filtered.length === 0) return "";
  return `
    <table style="width:100%;border-collapse:collapse;background:#fafafa;padding:24px;">
      ${filtered.map(([label, value]) => `
        <tr>
          <td style="padding:10px 16px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eee;">${escapeHtml(label)}</td>
          <td style="padding:10px 16px;color:#333;border-bottom:1px solid #eee;">${value}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function body(text: string): string {
  return `<div style="padding:24px;background:white;border-radius:0 0 12px 12px;"><p style="font-size:16px;color:#333;line-height:1.6;">${text}</p></div>`;
}

export function ownerBookingNotification(params: {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  country?: string | null;
  budget?: string | null;
  timeline?: string | null;
  preferredContactMethod?: string | null;
  preferredDate: string;
  preferredTime?: string | null;
  projectType?: string | null;
  message?: string | null;
}): string {
  return wrapper(`
    ${header("New Consultation Booking", `From ${safe(params.name)}`)}
    ${detailTable([
      ["Name", safe(params.name)],
      ["Email", safe(params.email)],
      ["Phone", safeVal(params.phone)],
      ["Company", safeVal(params.company)],
      ["Date", formatDate(params.preferredDate)],
      ["Time", formatTime(params.preferredTime || null)],
      ["Website", safeVal(params.website)],
      ["Country", safeVal(params.country)],
      ["Budget", safeVal(params.budget)],
      ["Timeline", safeVal(params.timeline)],
      ["Contact Method", safeVal(params.preferredContactMethod)],
      ["Project Type", safe(params.projectType)],
    ])}
    ${params.message ? body(escapeHtml(params.message)) : ""}
  `);
}

export function clientConfirmation(params: {
  name: string;
  preferredDate: string;
  preferredTime?: string | null;
  meetingType?: string | null;
  siteUrl: string;
}): string {
  const dateStr = formatDate(params.preferredDate);
  const timeStr = formatTime(params.preferredTime || null);
  return wrapper(`
    ${header("Booking Request Received!")}
    <div style="padding:32px;background:white;border-radius:0 0 12px 12px;">
      <p style="font-size:16px;color:#333;line-height:1.6;">Hi ${safe(params.name)},</p>
      <p style="font-size:16px;color:#555;line-height:1.6;">
        Thank you for booking${params.meetingType ? ` a <strong>${escapeHtml(params.meetingType)}</strong>` : ""}${timeStr ? ` on <strong>${dateStr} at ${timeStr}</strong>` : ` on <strong>${dateStr}</strong>`}.
        I will review your request and send a calendar invitation shortly.
      </p>
      <div style="margin:24px 0;text-align:center;">
        <a href="${escapeHtml(params.siteUrl)}/portfolio" style="display:inline-block;background:#18181b;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">
          View My Portfolio
        </a>
      </div>
      <p style="font-size:16px;color:#555;line-height:1.6;">
        Best regards,<br /><strong>Emmett Anthony</strong>
      </p>
    </div>
  `);
}

export function reminderEmail(params: {
  name: string;
  date: Date;
  time?: string | null;
  duration?: number | null;
  siteUrl: string;
}): string {
  const dateStr = formatDate(params.date);
  const timeStr = formatTime(params.time || null);
  return wrapper(`
    ${header("Reminder: Your Consultation is Tomorrow")}
    <div style="padding:32px;background:white;border-radius:0 0 12px 12px;">
      <p style="font-size:16px;color:#333;line-height:1.6;">Hi ${safe(params.name)},</p>
      <p style="font-size:16px;color:#555;line-height:1.6;">
        This is a friendly reminder about your upcoming consultation with <strong>Emmett Anthony</strong>.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#64748b;"><strong>Date:</strong> ${dateStr}</p>
        ${timeStr ? `<p style="margin:0 0 8px;font-size:14px;color:#64748b;"><strong>Time:</strong> ${timeStr}</p>` : ""}
        ${params.duration ? `<p style="margin:0;font-size:14px;color:#64748b;"><strong>Duration:</strong> ${params.duration} minutes</p>` : ""}
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
        Need to reschedule?
        <a href="${escapeHtml(params.siteUrl)}/booking?reschedule=" style="color:${brandColor};">Click here</a> to manage your appointment.
      </p>
      <p style="font-size:16px;color:#555;line-height:1.6;margin-top:24px;">
        Best regards,<br /><strong>Emmett Anthony</strong>
      </p>
    </div>
  `);
}

export function contactNotification(params: {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject: string;
  message: string;
}): string {
  return wrapper(`
    ${header("New Contact Form Submission", `From ${safe(params.name)}`)}
    ${detailTable([
      ["Name", safe(params.name)],
      ["Email", safe(params.email)],
      ["Phone", safeVal(params.phone)],
      ["Company", safeVal(params.company)],
      ["Subject", safe(params.subject)],
    ])}
    <div style="padding:24px;background:white;border-radius:0 0 12px 12px;">
      <h3 style="margin:0 0 8px;color:#333;">Message</h3>
      <p style="line-height:1.6;color:#555;">${escapeHtml(params.message)}</p>
    </div>
  `);
}

export function ticketConfirmation(params: {
  fullName: string;
  ticketNumber: string;
  subject: string;
  description: string;
  siteUrl?: string;
}): string {
  return wrapper(`
    ${header("Ticket Confirmed", `Hi ${safe(params.fullName)}`)}
    ${body(`
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
        Your support ticket has been created successfully.
      </p>
      <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Ticket Number</p>
        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1e40af;">${safe(params.ticketNumber)}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Subject</p>
        <p style="margin:0 0 12px;font-size:15px;color:#1e40af;">${safe(params.subject)}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Description</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${safe(params.description)}</p>
      </div>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
        Our team will review your request and get back to you as soon as possible.
        You can track the status of your ticket using the ticket number above.
      </p>
    `)}
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 28px;background:#111827;border-radius:8px;text-align:center;">
        <a href="${safe(params.siteUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev")}/support/ticket/${safe(params.ticketNumber)}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
          View Ticket →
        </a>
      </td></tr>
    </table>
  `);
}

export function ticketReplyNotification(params: {
  visitorName: string;
  message: string;
  staffName: string;
  ticketNumber: string;
  siteUrl?: string;
}): string {
  return wrapper(`
    ${header("New Reply", `Hi ${safe(params.visitorName)}`)}
    ${body(`
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
        ${safe(params.staffName)} has replied to your ticket <strong>${safe(params.ticketNumber)}</strong>:
      </p>
      <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin-bottom:16px;">
        <p style="margin:0;font-size:15px;color:#1e40af;line-height:1.7;white-space:pre-wrap;">${escapeHtml(params.message)}</p>
      </div>
    `)}
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 28px;background:#111827;border-radius:8px;text-align:center;">
        <a href="${safe(params.siteUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev")}/support/ticket/${safe(params.ticketNumber)}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
          Reply to Ticket →
        </a>
      </td></tr>
    </table>
  `);
}

export function ticketStatusChanged(params: {
  fullName: string;
  ticketNumber: string;
  oldStatus: string;
  newStatus: string;
  siteUrl?: string;
}): string {
  return wrapper(`
    ${header("Status Update", `Hi ${safe(params.fullName)}`)}
    ${body(`
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
        The status of your ticket <strong>${safe(params.ticketNumber)}</strong> has been updated:
      </p>
      <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin-bottom:16px;text-align:center;">
        <span style="font-size:14px;color:#6b7280;">${safe(params.oldStatus)}</span>
        <span style="margin:0 12px;font-size:18px;color:#9ca3af;">→</span>
        <span style="font-size:14px;font-weight:700;color:#1e40af;">${safe(params.newStatus)}</span>
      </div>
    `)}
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 28px;background:#111827;border-radius:8px;text-align:center;">
        <a href="${safe(params.siteUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev")}/support/ticket/${safe(params.ticketNumber)}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
          View Ticket →
        </a>
      </td></tr>
    </table>
  `);
}

export function ticketClosedSurvey(params: {
  fullName: string;
  ticketNumber: string;
  ratingUrl: string;
  siteUrl?: string;
}): string {
  const stars = Array.from({ length: 5 }, (_, i) => 
    `<a href="${safe(params.ratingUrl)}&rating=${i + 1}" style="display:inline-block;text-decoration:none;font-size:32px;color:#f59e0b;padding:0 4px;">★</a>`
  ).join("");

  return wrapper(`
    ${header("How did we do?", `Hi ${safe(params.fullName)}`)}
    ${body(`
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
        Your ticket <strong>${safe(params.ticketNumber)}</strong> has been closed. We'd love to hear your feedback!
      </p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
        How would you rate your support experience?
      </p>
      <div style="text-align:center;padding:20px 0;">
        ${stars}
      </div>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
        Click a star to rate your experience. Your feedback helps us improve.
      </p>
    `)}
  `);
}
