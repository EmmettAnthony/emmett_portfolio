import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processAutomationQueue, processReEngagement } from "@/lib/cron/automation-processor";
import { sendCampaignEmail } from "@/lib/email";
import { chiSquarePValue } from "@/lib/stats";
import { calculateNextRun } from "@/lib/recurring";

export const maxDuration = 300;

async function processScheduledCampaigns() {
  const now = new Date();

  const scheduled = await prisma.campaign.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: { template: true },
  });

  for (const campaign of scheduled) {
    try {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "SENDING" },
      });

      const subscribers = await prisma.subscriber.findMany({
        where: { status: "ACTIVE" },
      });

      if (subscribers.length === 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "SENT", sentAt: now, completedAt: now, totalRecipients: 0 },
        });
        continue;
      }

      const settings = await prisma.newsletterSettings.findUnique({ where: { id: "global" } });
      let sentCount = 0;
      const errors: { email: string; error: string }[] = [];          for (const subscriber of subscribers) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma types differ from function params
              const result = await sendCampaignEmail(campaign as any, subscriber as any, {
                trackOpens: settings?.trackOpens ?? true,
            unsubscribeFooter: settings?.unsubscribeFooter,
          });

          if (result.success) {
            await prisma.emailLog.create({
              data: {
                campaignId: campaign.id,
                subscriberId: subscriber.id,
                email: subscriber.email,
                subject: campaign.subject,
                status: "sent",
                sentAt: new Date(),
                resendId: typeof result.data === "object" && result.data ? (result.data as { id?: string }).id || null : null,
              },
            });

            await prisma.campaignEvent.create({
              data: {
                campaignId: campaign.id,
                subscriberId: subscriber.id,
                email: subscriber.email,
                eventType: "sent",
              },
            });

            sentCount++;
          } else {
            errors.push({ email: subscriber.email, error: String(result.error || "Unknown error") });
          }
        } catch (err) {
          errors.push({ email: subscriber.email, error: err instanceof Error ? err.message : "Unknown error" });
        }
      }

      const finalStatus = errors.length === 0 ? "SENT" : errors.length === subscribers.length ? "FAILED" : "SENT";

      if (campaign.recurringFrequency && finalStatus === "SENT") {
        const newCount = campaign.recurringCount + 1;
        const maxReached = campaign.recurringMaxCount !== null && newCount >= campaign.recurringMaxCount;
        const ended = campaign.recurringEndsAt && new Date(campaign.recurringEndsAt) <= now;

        if (maxReached || ended) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              status: "SENT",
              sentAt: now,
              completedAt: now,
              totalRecipients: sentCount,
              recurringCount: newCount,
              recurringNextRunAt: null,
            },
          });
        } else {
          const nextRun = calculateNextRun(campaign);
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              status: "SCHEDULED",
              scheduledAt: nextRun,
              sentAt: now,
              completedAt: now,
              totalRecipients: sentCount,
              recurringCount: newCount,
              recurringNextRunAt: nextRun,
            },
          });
        }
      } else {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: finalStatus,
            sentAt: finalStatus === "SENT" ? now : undefined,
            completedAt: now,
            totalRecipients: sentCount,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to process scheduled campaign ${campaign.id}:`, error);
    }
  }

  return scheduled.length;
}

async function processAbTestWinnerPromotion() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const campaigns = await prisma.campaign.findMany({
    where: {
      abTestEnabled: true,
      abTestWinner: null,
      status: "AWAITING_WINNER",
      sentAt: { lte: cutoff },
    },
  });

  let promoted = 0;

  for (const campaign of campaigns) {
    try {
      const [aOpens, bOpens, aSent, bSent] = await Promise.all([
        prisma.campaignEvent.count({
          where: { campaignId: campaign.id, eventType: "opened", metadata: { path: ["variant"], equals: "A" } },
        }),
        prisma.campaignEvent.count({
          where: { campaignId: campaign.id, eventType: "opened", metadata: { path: ["variant"], equals: "B" } },
        }),
        prisma.campaignEvent.count({
          where: { campaignId: campaign.id, eventType: "sent", metadata: { path: ["variant"], equals: "A" } },
        }),
        prisma.campaignEvent.count({
          where: { campaignId: campaign.id, eventType: "sent", metadata: { path: ["variant"], equals: "B" } },
        }),
      ] as const);

      if (aSent === 0 && bSent === 0) continue;

      const pValue = chiSquarePValue(aOpens, aSent - aOpens, bOpens, bSent - bOpens);
      const aRate = aSent > 0 ? aOpens / aSent : 0;
      const bRate = bSent > 0 ? bOpens / bSent : 0;
      const winner = pValue < 0.05 ? (aRate > bRate ? "A" : "B") : aRate >= bRate ? "A" : "B";

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { abTestWinner: winner, abTestWinnerDeclaredAt: now },
      });

      const remainingSubscribers = await prisma.subscriber.findMany({
        where: {
          status: "ACTIVE",
          id: {
            notIn: (
              await prisma.emailLog.findMany({
                where: { campaignId: campaign.id },
                select: { subscriberId: true },
                distinct: ["subscriberId"],
              })
            ).map((l) => l.subscriberId).filter(Boolean) as string[],
          },
        },
      });

      if (remainingSubscribers.length === 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "SENT", completedAt: now },
        });
        continue;
      }

      let sentCount = 0;
      const isVariantA = winner === "A";

      const parsedA = campaign.abTestVariantA ? safeParseJson(campaign.abTestVariantA) : null;
      const parsedB = campaign.abTestVariantB ? safeParseJson(campaign.abTestVariantB) : null;
      const variantData = isVariantA ? parsedA : parsedB;
      const winSubject = typeof variantData === "object" && variantData ? (variantData as Record<string, unknown>)?.subject as string || campaign.subject : campaign.subject;          for (const subscriber of remainingSubscribers) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma types differ from function params
              const result = await sendCampaignEmail(campaign as any, subscriber as any, {
            trackOpens: true,
            unsubscribeFooter: null,
          });

          if (result.success) {
            await prisma.emailLog.create({
              data: {
                campaignId: campaign.id,
                subscriberId: subscriber.id,
                email: subscriber.email,
                subject: winSubject || campaign.subject,
                status: "sent",
                sentAt: new Date(),
                resendId: result.data?.id,
              },
            });

            await prisma.campaignEvent.create({
              data: {
                campaignId: campaign.id,
                subscriberId: subscriber.id,
                email: subscriber.email,
                eventType: "sent",
                metadata: { variant: winner },
              },
            });

            sentCount++;
          }
        } catch {
          // skip failed sends
        }
      }

      const existingSent = campaign.totalRecipients || 0;
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "SENT",
          completedAt: now,
          totalRecipients: existingSent + sentCount,
        },
      });

      promoted++;
    } catch (error) {
      console.error(`Failed to promote A/B winner for campaign ${campaign.id}:`, error);
    }
  }

  return promoted;
}

function safeParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = process.env.CRON_SECRET;
    if (authHeader) {
      const headerValue = request.headers.get("authorization");
      if (headerValue !== `Bearer ${authHeader}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const [autoResult, reEngagementResult, scheduledCount, abTestResult] = await Promise.all([
      processAutomationQueue().then(() => "ok").catch((e) => String(e)),
      processReEngagement().then(() => "ok").catch((e) => String(e)),
      processScheduledCampaigns(),
      processAbTestWinnerPromotion(),
    ]);

    return NextResponse.json({
      success: true,
      automationQueue: autoResult,
      reEngagement: reEngagementResult,
      scheduledCampaignsProcessed: scheduledCount,
      abTestWinnerPromotions: abTestResult,
    });
  } catch (error) {
    console.error("Cron processing failed:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
