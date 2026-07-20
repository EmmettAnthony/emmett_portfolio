import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";
import { dispatchWebhook } from "@/lib/webhooks";

interface ResendWebhookPayload {
  type: string;
  data: {
    id: string;
    to: string[];
    subject?: string;
    tag?: string;
    created_at?: string;
    email_id?: string;
    bounce?: {
      code: number;
      description: string;
      details: string;
    };
    complaint?: {
      code: number;
      description: string;
      details: string;
    };
  };
}

export async function POST(request: Request) {
  try {
    const body: ResendWebhookPayload = await request.json();
    const { type, data } = body;

    const email = data.to?.[0]?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "No email in payload" }, { status: 400 });
    }

    switch (type) {
      case "email.bounced": {
        const subscriber = await prisma.subscriber.findUnique({ where: { email } });
        if (subscriber) {
          await prisma.subscriber.update({
            where: { email },
            data: { status: "BOUNCED" },
          });
        }

        await prisma.emailLog.updateMany({
          where: { email, status: { not: "bounced" } },
          data: {
            status: "bounced",
            error: data.bounce?.description || "Bounced",
          },
        });

        dispatchWebhook("bounce", { email, reason: data.bounce?.description || null }).catch(() => {});

        if (data.email_id) {
          const log = await prisma.emailLog.findFirst({
            where: { resendId: data.email_id },
          });
          if (log) {
            await prisma.campaignEvent.create({
              data: {
                campaignId: log.campaignId || "",
                subscriberId: log.subscriberId || "",
                email,
                eventType: "bounced",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON type
                metadata: { bounce: data.bounce },
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
              } as any,
            });
          }
        }
        break;
      }

      case "email.complained": {
        const subscriber = await prisma.subscriber.findUnique({ where: { email } });
        if (subscriber) {
          await prisma.subscriber.update({
            where: { email },
            data: { status: "BOUNCED" },
          });
        }

        if (data.email_id) {
          const log = await prisma.emailLog.findFirst({
            where: { resendId: data.email_id },
          });
          if (log) {
            await prisma.campaignEvent.create({
              data: {
                campaignId: log.campaignId || "",
                subscriberId: log.subscriberId || "",
                email,
                eventType: "complained",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON type
                metadata: { complaint: data.complaint },
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
              } as any,
            });
          }
        }
        break;
      }

      case "email.delivered": {
        await prisma.emailLog.updateMany({
          where: { email, status: "queued" },
          data: { status: "delivered", sentAt: new Date() },
        });
        break;
      }

      case "email.sent": {
        await prisma.emailLog.updateMany({
          where: { email, status: "queued" },
          data: { status: "sent", sentAt: new Date() },
        });
        break;
      }
    }

    cache.invalidate("newsletter:campaign-daily");
    cache.invalidate("newsletter:campaign-clicks");

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
