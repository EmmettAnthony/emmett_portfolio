import { getBrevo } from "@/lib/brevo/client";

const DEFAULT_FROM_NAME = "Emmett Anthony";
const DEFAULT_FROM_EMAIL = "newsletter@emmettanthony.dev";

function parseFromAddress(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: DEFAULT_FROM_NAME, email: from };
}

export async function sendEmailViaBrevo(options: {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  campaignId?: string;
  subscriberId?: string;
}) {
  try {
    const brevo = getBrevo();
    const from = parseFromAddress(options.from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`);
    const toList = (Array.isArray(options.to) ? options.to : [options.to]).map((email) => ({ email }));

    const tags = [options.campaignId, options.subscriberId].filter(Boolean) as string[];

    const result = await brevo.transactional.sendEmail({
      sender: { name: from.name, email: from.email },
      to: toList,
      subject: options.subject,
      htmlContent: options.html,
      replyTo: options.replyTo ? { email: options.replyTo } : undefined,
      ...(tags.length > 0 ? { tags } : {}),
    });

    return { success: true, data: { id: result.messageId }, error: null };
  } catch (err) {
    console.error("Failed to send email via Brevo:", err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
