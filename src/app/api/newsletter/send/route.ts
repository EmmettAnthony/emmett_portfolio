import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";
import { sendCampaignEmail } from "@/lib/email";
import { sendTestEmailSchema } from "@/lib/validations/newsletter";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { campaignId, test: isTest, testEmails: rawTestEmails, timezoneOptimize } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { template: true, segment: { include: { tags: true } } },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "DRAFT") {
      return NextResponse.json({ error: "Campaign must be approved before sending" }, { status: 400 });
    }

    if (campaign.status === "REVIEW") {
      return NextResponse.json({ error: "Campaign must be approved before sending" }, { status: 400 });
    }

    if (["SENT", "SCHEDULED", "AWAITING_WINNER"].includes(campaign.status)) {
      return NextResponse.json({ error: "Campaign already sent/scheduled" }, { status: 400 });
    }

    if (campaign.recurringFrequency && !isTest) {
      return NextResponse.json({ error: "Recurring campaigns are sent automatically via the cron scheduler. Use Schedule instead." }, { status: 400 });
    }

    const testEmails = rawTestEmails || (isTest ? [] : null);

    if (testEmails && testEmails.length > 0) {
      const parsed = sendTestEmailSchema.safeParse({ campaignId, testEmails });
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
      }

      const results = [];
      for (const email of parsed.data.testEmails) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma types differ from function params
        const result = await sendCampaignEmail(campaign as any, {
          id: "test",
          firstName: "Test",
          lastName: "User",
          email,
          phone: null,
          company: null,
          country: null,
          tags: null,
          source: null,
          status: "ACTIVE",
          verificationToken: null,
          verifiedAt: null,
          gdprConsent: false,
          subscribedAt: new Date(),
          lastOpenedAt: null,
          lastClickedAt: null,
          notes: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any, {
          trackOpens: false,
          unsubscribeFooter: null,
        });

        results.push({ email, success: result.success, error: result.error });
      }

      return NextResponse.json({ message: "Test emails sent", results });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    });

    const segment = campaign.segment;
    const baseWhere: Record<string, unknown> = { status: "ACTIVE" };

    if (segment?.criteria) {
      const criteria = segment.criteria as Record<string, unknown>;
      if (criteria.countries && Array.isArray(criteria.countries) && criteria.countries.length > 0) {
        baseWhere.country = { in: criteria.countries } as Record<string, unknown>;
      }
      if (criteria.sources && Array.isArray(criteria.sources) && criteria.sources.length > 0) {
        baseWhere.source = { in: criteria.sources } as Record<string, unknown>;
      }
      if (criteria.lastOpenedDays) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (criteria.lastOpenedDays as number));
        baseWhere.lastOpenedAt = { gte: cutoff } as Record<string, unknown>;
      }
    }

    const subscribers = await prisma.subscriber.findMany({
      where: baseWhere as Record<string, unknown>,
      include: { preferences: true },
    });

    if (subscribers.length === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "SENT", sentAt: new Date(), completedAt: new Date(), totalRecipients: 0 },
      });

      return NextResponse.json({ message: "No active subscribers matching segment", sent: 0 });
    }

    const settings = await prisma.newsletterSettings.findUnique({ where: { id: "global" } });
    let sentCount = 0;
    const errors: { email: string; error: string }[] = [];

    const abTestEnabled = campaign.abTestEnabled && campaign.abTestVariantA && campaign.abTestVariantB;
    let variantA: { subject?: string } | null = null;
    let variantB: { subject?: string } | null = null;

    if (abTestEnabled) {
      try {
        const rawA = JSON.parse(campaign.abTestVariantA || "{}");
        const rawB = JSON.parse(campaign.abTestVariantB || "{}");
        variantA = typeof rawA === "string" ? { subject: rawA } : rawA;
        variantB = typeof rawB === "string" ? { subject: rawB } : rawB;
      } catch {
        // stored as plain strings, treat as subjects
        variantA = { subject: campaign.abTestVariantA || "" };
        variantB = { subject: campaign.abTestVariantB || "" };
      }
    }

    const testPercent = campaign.abTestTestPercent ?? 20;
    const testGroupSize = abTestEnabled && !campaign.abTestWinner
      ? Math.max(2, Math.floor(subscribers.length * testPercent / 100))
      : subscribers.length;
    const halfMark = abTestEnabled ? Math.floor(testGroupSize / 2) : testGroupSize;
    const subscribersToProcess = abTestEnabled && !campaign.abTestWinner
      ? subscribers.slice(0, testGroupSize)
      : subscribers;

    let timezoneDelays: Map<string, number> | null = null;
    if (timezoneOptimize) {
      timezoneDelays = new Map();
      const now = new Date();
      const groupedByTz: Record<string, typeof subscribers> = {};
      for (const s of subscribers) {
        const tz = s.timezone || "UTC";
        if (!groupedByTz[tz]) groupedByTz[tz] = [];
        groupedByTz[tz].push(s);
      }
      for (const [tz, group] of Object.entries(groupedByTz)) {
        const preferredHour = group[0]?.preferences?.preferredSendHour ?? 9;
        const tzOffsetHours = getTzOffsetHours(tz);
        const nowLocalHour = (now.getUTCHours() + tzOffsetHours + 24) % 24;
        let delayMs = 0;
        if (nowLocalHour < preferredHour) {
          delayMs = (preferredHour - nowLocalHour) * 3600000;
        } else {
          delayMs = (24 - nowLocalHour + preferredHour) * 3600000;
        }
        for (const s of group) {
          timezoneDelays!.set(s.id, delayMs);
        }
      }
    }

    for (let i = 0; i < subscribersToProcess.length; i++) {
      const subscriber = subscribersToProcess[i];

      let variant: "A" | "B" | null = null;
      if (abTestEnabled && variantA && variantB) {
        if (campaign.abTestWinner) {
          variant = campaign.abTestWinner as "A" | "B";
        } else {
          variant = i < halfMark ? "A" : "B";
        }
      }

      try {
        const emailLog = await prisma.emailLog.create({
          data: {
            campaignId,
            subscriberId: subscriber.id,
            email: subscriber.email,
            subject: variant ? (variant === "A" ? variantA!.subject : variantB!.subject) || campaign.subject : campaign.subject,
            status: "queued",
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma types differ from function params
      const result = await sendCampaignEmail(campaign as any, subscriber as any, {
          trackOpens: settings?.trackOpens ?? true,
          unsubscribeFooter: settings?.unsubscribeFooter,
        });

        if (result.success) {
          await prisma.emailLog.update({
            where: { id: emailLog.id },
            data: {
              status: "sent",
              sentAt: new Date(),
              resendId: result.data?.id,
            },
          });

          await prisma.campaignEvent.create({
            data: {
              campaignId,
              subscriberId: subscriber.id,
              email: subscriber.email,
              eventType: "sent",
                  metadata: variant ? { variant } : undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma type mismatch
                } as any,
          });

          sentCount++;
        } else {
          await prisma.emailLog.update({
            where: { id: emailLog.id },
            data: { status: "failed", error: String(result.error) },
          });

          errors.push({ email: subscriber.email, error: String(result.error || "Unknown error") });
        }
      } catch (err) {
        errors.push({ email: subscriber.email, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    const awaitingWinner = abTestEnabled && !campaign.abTestWinner;
    const finalStatus = errors.length === 0 ? (awaitingWinner ? "AWAITING_WINNER" : "SENT") : errors.length === subscribersToProcess.length ? "FAILED" : "SENT";
    const remainingCount = awaitingWinner ? subscribers.length - testGroupSize : 0;

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        sentAt: finalStatus === "SENT" ? new Date() : undefined,
        completedAt: awaitingWinner ? undefined : new Date(),
        totalRecipients: sentCount,
        metadata: awaitingWinner
          ? { ...((campaign.metadata as Record<string, unknown>) || {}), abTestRemainingCount: remainingCount }
          : undefined,
      },
    });

    cache.invalidate("newsletter:analytics");
    cache.invalidate(`newsletter:campaign-daily:${campaignId}`);

    return NextResponse.json({
      message: awaitingWinner
        ? `A/B test sent to ${sentCount} subscribers (test group). Winner will be promoted to ${remainingCount} remaining.`
        : `Campaign sent to ${sentCount} subscribers`,
      sent: sentCount,
      failed: errors.length,
      remainingForWinner: awaitingWinner ? remainingCount : 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Failed to send campaign:", error);
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 });
  }
}

function getTzOffsetHours(tz: string): number {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    return (tzDate.getTime() - utcDate.getTime()) / 3600000;
  } catch {
    return 0;
  }
}
