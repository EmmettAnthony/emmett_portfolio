import { escapeHtml } from "@/lib/utils/string-guards";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev";

function formatMessages(messages: { role: string; content: string; createdAt: Date }[]): string {
  return messages
    .map((m) => {
      const role = m.role === "user" ? "Visitor" : "Assistant";
      const time = new Date(m.createdAt).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });
      return `
        <tr>
          <td style="padding:10px 16px;background:${m.role === "user" ? "#f0f9ff" : "#f9fafb"};border-bottom:1px solid #e5e7eb;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:12px;font-weight:600;color:${m.role === "user" ? "#2563eb" : "#6b7280"};text-transform:uppercase;letter-spacing:0.3px;">${role}</span>
              <span style="font-size:11px;color:#9ca3af;">${time}</span>
            </div>
            <p style="margin:0;font-size:14px;color:#111827;line-height:1.6;white-space:pre-wrap;">${escapeHtml(m.content)}</p>
          </td>
        </tr>`;
    })
    .join("\n");
}

export function escalationTranscriptTemplate(params: {
  conversationId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorId?: string | null;
  messageCount: number;
  messages: { role: string; content: string; createdAt: Date }[];
  source: string;
  language: string;
}): { subject: string; html: string } {
  const escapedName = params.visitorName
    ? escapeHtml(params.visitorName)
    : null;
  const subject = "🚨 Chat Escalated — Help requested by " + (escapedName || "a visitor");
  const dashboardUrl = SITE_URL + "/dashboard/chatbot/conversations/" + params.conversationId;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chat Escalation — ${escapedName || "Unknown Visitor"}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🚨 Human Assistance Requested</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
            A visitor has asked to speak with a real person
          </p>
        </td></tr>

        <tr><td style="padding:32px 40px 8px;">
          <h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">Visitor Details</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${escapedName ? '<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:120px;">Name</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500;">' + escapedName + '</td></tr>' : ""}
            ${params.visitorEmail ? '<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500;"><a href="mailto:' + params.visitorEmail + '" style="color:#2563eb;text-decoration:none;">' + params.visitorEmail + '</a></td></tr>' : ""}
            <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Source</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500;">${params.source}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Language</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500;">${params.language}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Messages</td><td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500;">${params.messageCount}</td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:16px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="padding:12px 28px;background:#111827;border-radius:8px;text-align:center;">
              <a href="${dashboardUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Open Conversation in Dashboard →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 40px 8px;border-top:1px solid #e5e7eb;">
          <h2 style="margin:0;font-size:16px;font-weight:600;color:#111827;">💬 Conversation Transcript (${params.messageCount} messages)</h2>
        </td></tr>

        <tr><td style="padding:8px 40px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            ${formatMessages(params.messages)}
          </table>
        </td></tr>

        <tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e5e7eb;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                <strong style="color:#111827;">Emmett Anthony</strong> · Professional Software Developer
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
                ${SITE_URL}
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                This is an automated alert from the chatbot system.<br />
                Please respond to this visitor as soon as possible.
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
