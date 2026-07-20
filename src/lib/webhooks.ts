import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function dispatchWebhook(event: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        active: true,
        events: { contains: event },
      },
    });

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    for (const webhook of webhooks) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "NewsletterWebhook/1.0",
      };

      if (webhook.secret) {
        const hmac = crypto.createHmac("sha256", webhook.secret);
        hmac.update(body);
        headers["X-Webhook-Signature"] = hmac.digest("hex");
      }

      fetch(webhook.url, {
        method: "POST",
        headers,
        body,
      }).catch((err) => {
        console.error(`Failed to dispatch webhook ${webhook.id} to ${webhook.url}:`, err);
      });
    }
  } catch (error) {
    console.error("Failed to dispatch webhooks:", error);
  }
}
