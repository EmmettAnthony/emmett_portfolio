import { prisma } from "@/lib/db";
import { sendEmail, personalizeContent } from "@/lib/email";
import type { Prisma } from "@prisma/client";

export async function processWelcomeSeries(subscriberId: string) {
  const automations = await prisma.automation.findMany({
    where: { triggerType: "welcome_series", status: "ACTIVE" },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  for (const automation of automations) {
    for (const step of automation.steps) {
      const delayMs = step.delayDays * 86400000 + step.delayHours * 3600000;
      const executeAt = new Date(Date.now() + delayMs);

      await prisma.automationStep.update({
        where: { id: step.id },
        data: {
          condition: {
            ...(step.condition as Record<string, unknown>),
            _scheduledFor: subscriberId,
            _executeAt: executeAt.toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    }
  }
}

export async function processTagAutomation(subscriberId: string, _tagSlug: string) {
  const automations = await prisma.automation.findMany({
    where: { triggerType: "tag_added", status: "ACTIVE" },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  for (const automation of automations) {
    for (const step of automation.steps) {
      const delayMs = step.delayDays * 86400000 + step.delayHours * 3600000;
      const executeAt = new Date(Date.now() + delayMs);

      await prisma.automationStep.update({
        where: { id: step.id },
        data: {
          condition: {
            ...(step.condition as Record<string, unknown>),
            _scheduledFor: subscriberId,
            _executeAt: executeAt.toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    }
  }
}

export async function processReEngagement() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const automations = await prisma.automation.findMany({
    where: { triggerType: "re_engagement", status: "ACTIVE" },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  if (automations.length === 0) return;

  const inactiveSubscribers = await prisma.subscriber.findMany({
    where: { status: "ACTIVE", lastOpenedAt: { lt: cutoffDate } },
    take: 100,
  });

  for (const automation of automations) {
    for (const subscriber of inactiveSubscribers) {
      for (const step of automation.steps) {
        const delayMs = step.delayDays * 86400000 + step.delayHours * 3600000;
        const executeAt = new Date(Date.now() + delayMs);

        await prisma.automationStep.update({
          where: { id: step.id },
          data: {
            condition: {
              ...(step.condition as Record<string, unknown>),
              _scheduledFor: subscriber.id,
              _executeAt: executeAt.toISOString(),
            } as Prisma.InputJsonValue,
          },
        });
      }
    }
  }
}

export async function processAutomationQueue() {
  const now = new Date();

  const steps = await prisma.automationStep.findMany({
    where: { condition: { path: ["_executeAt"], lte: now.toISOString() } },
    include: { automation: { include: { campaign: true } } },
  });

  for (const step of steps) {
    try {
      const condition = step.condition as Record<string, unknown> | null;
      const subscriberId = condition?._scheduledFor as string | undefined;

      if (!subscriberId || !step.subject || !step.content) continue;

      const subscriber = await prisma.subscriber.findUnique({
        where: { id: subscriberId },
      });
      if (!subscriber || subscriber.status !== "ACTIVE") continue;

      const campaignId = step.automation.campaignId;

      const sub = subscriber as unknown as import("@/types/newsletter").Subscriber;
      const result = await sendEmail({
        to: subscriber.email,
        subject: personalizeContent(step.subject, sub),
        html: personalizeContent(step.content, sub),
        campaignId: campaignId || undefined,
        subscriberId: subscriber.id,
      });

      if (result.success) {
        if (campaignId) {
          await prisma.campaignEvent.create({
            data: {
              campaignId,
              subscriberId: subscriber.id,
              email: subscriber.email,
              eventType: "sent",
            } as unknown as Prisma.CampaignEventCreateInput,
          });
        }

        await prisma.emailLog.create({
          data: {
            subscriberId: subscriber.id,
            email: subscriber.email,
            subject: step.subject,
            status: "sent",
            sentAt: new Date(),
            resendId: typeof result.data === "object" && result.data ? (result.data as { id?: string }).id || null : null,
          } as Prisma.EmailLogCreateInput,
        });
      } else {
        await prisma.emailLog.create({
          data: {
            subscriberId: subscriber.id,
            email: subscriber.email,
            subject: step.subject,
            status: "failed",
            error: String(result.error || "Unknown error"),
          } as Prisma.EmailLogCreateInput,
        });
      }

      const cleanedCondition = { ...condition };
      delete (cleanedCondition as Record<string, unknown>)._scheduledFor;
      delete (cleanedCondition as Record<string, unknown>)._executeAt;

      await prisma.automationStep.update({
        where: { id: step.id },
        data: { condition: cleanedCondition as Prisma.InputJsonValue },
      });
    } catch (error) {
      console.error(`Failed to process automation step ${step.id}:`, error);
    }
  }
}
