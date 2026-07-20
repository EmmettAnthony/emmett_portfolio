import { getSiteSettings } from "@/lib/get-site-settings";
import { escapeHtml } from "@/lib/utils/string-guards";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev";

export async function adminReplyTemplate(params: {
  visitorName: string;
  message: string;
  adminName: string;
  conversationId: string;
}): Promise<{ subject: string; html: string }> {
  const { visitorName, message, adminName } = params;
  const settings = await getSiteSettings();
  const subject = `💬 ${adminName} has replied to your message`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reply from ${adminName}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2563eb,#3b82f6);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">💬 Reply from ${adminName}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
            Your question has been answered
          </p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:32px 40px 8px;">
          <p style="margin:0;font-size:15px;color:#374151;">Hi ${visitorName},</p>
          <p style="margin:12px 0 0;font-size:15px;color:#374151;line-height:1.6;">
            ${adminName} has personally responded to your message:
          </p>
        </td></tr>

        <!-- Reply message box -->
        <tr><td style="padding:16px 40px;">
          <div style="background:#f0f9ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;">
            <p style="margin:0;font-size:15px;color:#1e40af;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
          </div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:8px 40px 32px;">
          <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
            If you have any further questions, feel free to reply to this email or visit our website to continue the conversation.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="padding:12px 28px;background:#111827;border-radius:8px;text-align:center;">
              <a href="${SITE_URL}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Visit Website →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #e5e7eb;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                <strong style="color:#111827;">${settings.siteName}</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                This is an automated response to your chat conversation.<br />
                If you no longer wish to be contacted, please reply to this email.
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
