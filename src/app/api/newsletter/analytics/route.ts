import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const CACHE_KEY = "newsletter:analytics:overview";
    const cached = cache.get(CACHE_KEY);
    if (cached) return NextResponse.json(cached);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSubscribers,
      activeSubscribers,
      newThisMonth,
      unsubscribedThisMonth,
      bouncedThisMonth,
      totalCampaigns,
      sentCampaigns,
      activeCampaigns,
      totalOpens,
      totalClicks,
      totalBounces,
      totalUnsubscribes,
      totalSentEvents,
      growthData,
      campaignPerformance,
      subscribersBySource,
      subscribersByCountry,
      subscribersByStatus,
    ] = await Promise.all([
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { status: "ACTIVE" } }),
      prisma.subscriber.count({ where: { createdAt: { gte: firstOfMonth } } }),
      prisma.subscriber.count({ where: { status: "UNSUBSCRIBED", updatedAt: { gte: firstOfMonth } } }),
      prisma.subscriber.count({ where: { status: "BOUNCED", updatedAt: { gte: firstOfMonth } } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: "SENT" } }),
      prisma.campaign.count({ where: { status: { notIn: ["DRAFT", "CANCELLED"] } } }),
      prisma.campaignEvent.count({ where: { eventType: "opened" } }),
      prisma.campaignEvent.count({ where: { eventType: "clicked" } }),
      prisma.campaignEvent.count({ where: { eventType: "bounced" } }),
      prisma.campaignEvent.count({ where: { eventType: "unsubscribed" } }),
      prisma.campaignEvent.count({ where: { eventType: "sent" } }),
      getGrowthData(thirtyDaysAgo),
      getCampaignPerformance(),
      prisma.subscriber.groupBy({ by: ["source"], _count: { id: true }, where: { source: { not: null } } }),
      prisma.subscriber.groupBy({ by: ["country"], _count: { id: true }, where: { country: { not: null } } }),
      prisma.subscriber.groupBy({ by: ["status"], _count: { id: true } }),
    ]);

    const overallOpenRate = totalSentEvents > 0 ? (totalOpens / totalSentEvents) * 100 : 0;
    const overallClickRate = totalSentEvents > 0 ? (totalClicks / totalSentEvents) * 100 : 0;
    const overallBounceRate = totalSentEvents > 0 ? (totalBounces / totalSentEvents) * 100 : 0;
    const overallUnsubscribeRate = totalSentEvents > 0 ? (totalUnsubscribes / totalSentEvents) * 100 : 0;

    const result = {
      totalSubscribers,
      activeSubscribers,
      newSubscribersThisMonth: newThisMonth,
      unsubscribedThisMonth: unsubscribedThisMonth,
      bouncedThisMonth: bouncedThisMonth,
      totalCampaigns,
      activeCampaigns,
      sentCampaigns,
      overallOpenRate: Math.round(overallOpenRate * 100) / 100,
      overallClickRate: Math.round(overallClickRate * 100) / 100,
      overallBounceRate: Math.round(overallBounceRate * 100) / 100,
      overallUnsubscribeRate: Math.round(overallUnsubscribeRate * 100) / 100,
      growthData,
      campaignPerformance,
      dailyEventCounts: await getDailyEventCounts(thirtyDaysAgo),
      subscribersBySource: subscribersBySource.map((s) => ({ source: s.source, count: s._count.id })),
      subscribersByCountry: subscribersByCountry.map((c) => ({ country: c.country, count: c._count.id })),
      subscribersByStatus: subscribersByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    };

    cache.set(CACHE_KEY, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch newsletter analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

async function getGrowthData(since: Date) {
  const subscribers = await prisma.subscriber.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyCounts: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split("T")[0];
    dailyCounts[key] = 0;
  }

  for (const sub of subscribers) {
    const key = sub.createdAt.toISOString().split("T")[0];
    if (dailyCounts[key] !== undefined) dailyCounts[key]++;
  }

  let runningTotal = await prisma.subscriber.count({
    where: { createdAt: { lt: since } },
  });

  return Object.entries(dailyCounts).map(([date, count]) => {
    runningTotal += count;
    return { date, count: runningTotal };
  });
}

async function getDailyEventCounts(since: Date) {
  const events = await prisma.campaignEvent.findMany({
    where: { createdAt: { gte: since }, eventType: { in: ["opened", "clicked"] } },
    select: { eventType: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyCounts: Record<string, { opens: number; clicks: number }> = {};
  const days = Math.ceil((Date.now() - since.getTime()) / (24 * 60 * 60 * 1000));
  for (let i = 0; i < days; i++) {
    const date = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split("T")[0];
    dailyCounts[key] = { opens: 0, clicks: 0 };
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().split("T")[0];
    if (dailyCounts[key]) {
      if (event.eventType === "opened") dailyCounts[key].opens++;
      if (event.eventType === "clicked") dailyCounts[key].clicks++;
    }
  }

  return Object.entries(dailyCounts).map(([date, counts]) => ({
    date,
    ...counts,
  }));
}

async function getCampaignPerformance() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: "SENT" },
    select: {
      id: true,
      name: true,
      totalRecipients: true,
    },
    orderBy: { sentAt: "desc" },
    take: 20,
  });

  const performances = await Promise.all(
    campaigns.map(async (campaign) => {
      const [opens, clicks, sent] = await Promise.all([
        prisma.campaignEvent.count({ where: { campaignId: campaign.id, eventType: "opened" } }),
        prisma.campaignEvent.count({ where: { campaignId: campaign.id, eventType: "clicked" } }),
        prisma.campaignEvent.count({ where: { campaignId: campaign.id, eventType: "sent" } }),
      ]);

      const sentCount = campaign.totalRecipients || sent;

      return {
        id: campaign.id,
        name: campaign.name,
        sent: sentCount,
        opens,
        clicks,
        openRate: sentCount > 0 ? Math.round((opens / sentCount) * 10000) / 100 : 0,
        clickRate: sentCount > 0 ? Math.round((clicks / sentCount) * 10000) / 100 : 0,
      };
    })
  );

  return performances;
}
