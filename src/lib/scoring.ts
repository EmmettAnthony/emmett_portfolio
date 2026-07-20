import { prisma } from "@/lib/db";

export async function calculateEngagementScore(subscriberId: string): Promise<number> {
  const sub = await prisma.subscriber.findUnique({
    where: { id: subscriberId },
    select: { createdAt: true, lastOpenedAt: true, lastClickedAt: true, campaignEvents: { select: { eventType: true } } },
  });

  if (!sub) return 0;

  let score = 0;
  const now = Date.now();

  const events = sub.campaignEvents || [];
  const opens = events.filter((e) => e.eventType === "opened").length;
  const clicks = events.filter((e) => e.eventType === "clicked").length;

  score += Math.min(opens * 10, 40);
  score += Math.min(clicks * 15, 30);

  if (sub.lastOpenedAt) {
    const daysSinceOpen = (now - sub.lastOpenedAt.getTime()) / 86400000;
    if (daysSinceOpen < 7) score += 20;
    else if (daysSinceOpen < 30) score += 10;
    else if (daysSinceOpen < 90) score += 5;
  }

  if (sub.lastClickedAt) {
    const daysSinceClick = (now - sub.lastClickedAt.getTime()) / 86400000;
    if (daysSinceClick < 7) score += 10;
    else if (daysSinceClick < 30) score += 5;
  }

  const daysSinceSub = (now - sub.createdAt.getTime()) / 86400000;
  if (daysSinceSub > 365) score += 5;
  else if (daysSinceSub > 90) score += 3;

  return Math.min(Math.max(Math.round(score), 0), 100);
}

export async function recalculateAllScores() {
  const subs = await prisma.subscriber.findMany({ select: { id: true } });
  for (const sub of subs) {
    const score = await calculateEngagementScore(sub.id);
    await prisma.subscriber.update({ where: { id: sub.id }, data: { engagementScore: score } });
  }
  return subs.length;
}
