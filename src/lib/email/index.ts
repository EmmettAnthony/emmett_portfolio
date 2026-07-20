import { getResend } from "@/lib/resend";
import { sendEmailViaBrevo } from "@/lib/email/brevo";
import type { Subscriber, Campaign } from "@/types/newsletter";

const DEFAULT_FROM = "Emmett Anthony <newsletter@emmettanthony.dev>";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  campaignId?: string;
  subscriberId?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

/**
 * Replace personalization variables in content
 */
export function personalizeContent(content: string, subscriber: Partial<Subscriber>): string {
  const vars: Record<string, string | undefined | null> = {
    "{{first_name}}": subscriber.firstName,
    "{{last_name}}": subscriber.lastName,
    "{{email}}": subscriber.email,
    "{{company}}": subscriber.company,
    "{{full_name}}": [subscriber.firstName, subscriber.lastName].filter(Boolean).join(" "),
  };

  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, "\\{\\}"), "gi"), value ?? "");
  }
  return result;
}

/**
 * Generate a tracking pixel URL for open tracking
 */
export function getOpenTrackingPixel(campaignId: string, subscriberId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev";
  return `${baseUrl}/api/newsletter/track/open?campaignId=${campaignId}&subscriberId=${subscriberId}`;
}

/**
 * Generate a click tracking URL
 */
export function getClickTrackingUrl(campaignId: string, subscriberId: string, url: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev";
  return `${baseUrl}/api/newsletter/track/click?campaignId=${campaignId}&subscriberId=${subscriberId}&url=${encodeURIComponent(url)}`;
}

/**
 * Wrap email content with tracking pixel and unsubscribe link
 */
export function wrapEmailContent(
  html: string,
  campaignId: string,
  subscriberId: string,
  subscriberEmail: string,
  options?: { trackOpens?: boolean; unsubscribeFooter?: string | null }
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev";
  const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}&campaignId=${campaignId}`;
  const preferencesUrl = `${baseUrl}/newsletter/preferences?email=${encodeURIComponent(subscriberEmail)}`;

  const trackingPixel = options?.trackOpens !== false
    ? `<img src="${getOpenTrackingPixel(campaignId, subscriberId)}" width="1" height="1" alt="" style="display:none;" />`
    : "";

  const footer = options?.unsubscribeFooter || `
    <div style="text-align:center;padding:20px;font-size:12px;color:#888;">
      <p>You're receiving this because you subscribed to Emmett Anthony's newsletter.</p>
      <p>
        <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">Unsubscribe</a>
        &middot;
        <a href="${preferencesUrl}" style="color:#888;text-decoration:underline;">Update Preferences</a>
      </p>
    </div>
  `;

  return `
    ${html}
    ${trackingPixel}
    ${footer}
  `;
}

/**
 * Send an email using the configured provider (Resend or Brevo)
 * with tracking support.
 *
 * Set EMAIL_PROVIDER=brevo in .env.local to use Brevo instead of Resend.
 */
export async function sendEmail(options: SendEmailOptions) {
  const from = options.from || process.env.NEWSLETTER_FROM_EMAIL || DEFAULT_FROM;
  const provider = process.env.EMAIL_PROVIDER || "resend";

  if (provider === "brevo") {
    return sendEmailViaBrevo({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || process.env.NEWSLETTER_REPLY_TO || undefined,
      campaignId: options.campaignId,
      subscriberId: options.subscriberId,
    });
  }

  try {
    const resend = getResend();
    const response = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || process.env.NEWSLETTER_REPLY_TO,
      tags: options.campaignId
        ? [
            { name: "campaignId", value: options.campaignId },
            { name: "subscriberId", value: options.subscriberId || "" },
          ]
        : undefined,
    });

    return { success: true, data: response.data, error: response.error };
  } catch (err) {
    console.error("Failed to send email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send a campaign to a batch of subscribers with personalization and tracking
 */
export async function sendCampaignEmail(
  campaign: Campaign,
  subscriber: Subscriber,
  options?: { trackOpens?: boolean; unsubscribeFooter?: string | null }
) {
  const personalizedContent = personalizeContent(campaign.content, subscriber);
  const wrappedHtml = wrapEmailContent(
    personalizedContent,
    campaign.id,
    subscriber.id,
    subscriber.email,
    options
  );

  return sendEmail({
    to: subscriber.email,
    subject: personalizeContent(campaign.subject, subscriber),
    html: wrappedHtml,
    from: campaign.senderEmail
      ? `${campaign.senderName || "Emmett Anthony"} <${campaign.senderEmail}>`
      : undefined,
    replyTo: campaign.senderEmail || undefined,
    campaignId: campaign.id,
    subscriberId: subscriber.id,
    trackOpens: options?.trackOpens,
  });
}

/**
 * Build HTML email from blocks
 */
export function buildEmailFromBlocks(blocks: { type: string; content: Record<string, unknown> }[]): string {
  const blockRenderers: Record<string, (content: Record<string, unknown>) => string> = {
    text: (c) => {
      const fontSize = (c.fontSize as string) || "14";
      const color = (c.color as string) || "#374151";
      const alignment = (c.alignment as string) || (c.align as string) || "left";
      return `<div style="padding:10px 0;font-family:inherit;line-height:1.6;font-size:${fontSize}px;text-align:${alignment};color:${color};">${(c.text as string) || ""}</div>`;
    },
    image: (c) => {
      const src = (c.src as string) || "";
      const alt = (c.alt as string) || "";
      const width = (c.width as string) || "100%";
      const alignment = (c.alignment as string) || (c.align as string) || "center";
      return src ? `<div style="padding:10px 0;text-align:${alignment};">
        <img src="${src}" alt="${alt}" style="max-width:${width};height:auto;border-radius:8px;" />
      </div>` : "";
    },
    button: (c) => {
      const text = (c.text as string) || "Click Here";
      const url = (c.url as string) || "#";
      const color = (c.color as string) || (c.buttonColor as string) || "#2563eb";
      const textColor = (c.textColor as string) || "#ffffff";
      const borderRadius = (c.borderRadius as number) || 8;
      const alignment = (c.alignment as string) || (c.align as string) || "center";
      return `<div style="padding:15px 0;text-align:${alignment};">
        <a href="${url}" style="display:inline-block;padding:12px 32px;background-color:${color};color:${textColor};text-decoration:none;border-radius:${borderRadius}px;font-weight:600;font-size:14px;">
          ${text}
        </a>
      </div>`;
    },
    divider: (c) => {
      const style = (c.style as string) || "solid";
      const color = (c.color as string) || "#e5e7eb";
      const thickness = (c.thickness as string) || "1";
      return `<div style="padding:10px 0;"><hr style="border:none;border-top:${thickness}px ${style} ${color};" /></div>`;
    },
    spacer: (c) => `<div style="padding:${(c.height as number) || 20}px 0;"></div>`,
    header: (c) => {
      const text = (c.text as string) || "";
      const alignment = (c.alignment as string) || (c.align as string) || "center";
      const color = (c.color as string) || "#111827";
      const tag = (c.size as string) || "h2";
      const sizes: Record<string, string> = { h1: "28px", h2: "20px", h3: "16px" };
      return `<div style="padding:20px 0;text-align:${alignment};">
        <${tag} style="font-size:${sizes[tag] || "20px"};font-weight:700;margin:0;color:${color};">${text}</${tag}>
      </div>`;
    },
    footer: (c) => {
      const text = (c.text as string) || "";
      const alignment = (c.alignment as string) || "center";
      return `<div style="padding:20px 0;font-size:12px;color:#6b7280;text-align:${alignment};border-top:1px solid #e5e7eb;">
        ${text}
      </div>`;
    },
    cta: (c) => {
      const heading = c.heading as string;
      const ctaDescription = c.description as string;
      const buttonText = (c.buttonText as string) || (c.text as string) || "Get Started";
      const buttonUrl = (c.buttonUrl as string) || (c.url as string) || "#";
      const buttonColor = (c.buttonColor as string) || (c.color as string) || "#2563eb";
      return `<div style="padding:25px 0;text-align:center;background-color:#f9fafb;border-radius:12px;">
        ${heading ? `<h2 style="font-size:22px;margin:0 0 10px;color:#111827;">${heading}</h2>` : ""}
        ${ctaDescription ? `<p style="color:#6b7280;margin:0 0 20px;">${ctaDescription}</p>` : ""}
        <a href="${buttonUrl}" style="display:inline-block;padding:14px 36px;background-color:${buttonColor};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          ${buttonText}
        </a>
      </div>`;
    },
    columns: (c) => {
      const gap = (c.gap as number) || 16;
      const leftContent = (c.leftContent as string) || "";
      const rightContent = (c.rightContent as string) || "";
      const leftWidth = (c.leftWidth as string) || "50";
      const rightWidth = (c.rightWidth as string) || "50";
      return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
        <td width="${leftWidth}%" style="padding:0 ${gap}px 0 0;vertical-align:top;">${leftContent}</td>
        <td width="${rightWidth}%" style="padding:0 0 0 ${gap}px;vertical-align:top;">${rightContent}</td>
      </tr></table>`;
    },
    table: (c) => {
      const headers = (c.headers as string[]) || [];
      const rows = (c.rows as string[][]) || [];
      const borderColor = (c.borderColor as string) || "#e5e7eb";
      return `<table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
        ${headers.length > 0 ? `<thead><tr>${headers.map((h) => `<th style="border:1px solid ${borderColor};padding:8px;background:#f9fafb;font-weight:600;text-align:left;">${h}</th>`).join("")}</tr></thead>` : ""}
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid ${borderColor};padding:8px;">${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;
    },
    variable: (c) => {
      const variable = (c.variable as string) || "{{variable}}";

      return `<span style="display:inline-block;padding:2px 6px;margin:0 2px;font-family:monospace;font-size:13px;border-radius:4px;background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;">${variable}</span>`;
    },
    html: (c) => (c.html as string) || "",
  };

  const parts = blocks.map((block) => {
    const renderer = blockRenderers[block.type];
    if (!renderer) return "";
    return renderer(block.content);
  });

  return `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#374151;">
    ${parts.filter(Boolean).join("\n")}
  </div>`;
}
