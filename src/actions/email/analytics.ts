"use server";

import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { getBrevo } from "@/lib/brevo/client";
import type { DashboardStats, AnalyticsData, CampaignStats, CampaignPerformance } from "@/types/email";

export async function getEmailDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  if (!session?.user) {
    return {
      totalSubscribers: 0, activeSubscribers: 0, totalContacts: 0,
      transactionalEmailsSent: 0, totalCampaigns: 0, emailsSent: 0,
      openRate: 0, clickRate: 0, bounceRate: 0, spamRate: 0, totalUnsubscribes: 0,
      recentActivity: [],
      campaignPerformance: [],
    };
  }

  const [
    totalSubscribers,
    activeSubscribers,
    totalContacts,
    transactionalEmailsSent,
    totalCampaigns,
    recentLogs,
    recentCampaigns,
    unsubscribes,
  ] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.contactListMember.count(),
    prisma.emailLog.count({ where: { status: { not: "failed" } } }),
    prisma.campaign.count(),
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, status: true, sentAt: true, createdAt: true } }),
    prisma.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
  ]);

  // Campaign performance — per-campaign sent/opens/clicks/rates
  const sentCampaignsDetailed = await prisma.campaign.findMany({
    where: { status: "SENT" },
    select: { id: true, name: true, totalRecipients: true },
    orderBy: { sentAt: "desc" },
    take: 10,
  });

  const campaignPerformance: CampaignPerformance[] = await Promise.all(
    sentCampaignsDetailed.map(async (c) => {
      const [opens, clicks, sent] = await Promise.all([
        prisma.campaignEvent.count({ where: { campaignId: c.id, eventType: "opened" } }),
        prisma.campaignEvent.count({ where: { campaignId: c.id, eventType: "clicked" } }),
        prisma.campaignEvent.count({ where: { campaignId: c.id, eventType: "sent" } }),
      ]);
      const sentCount = c.totalRecipients || sent;
      return {
        id: c.id,
        name: c.name,
        sent: sentCount,
        opens,
        clicks,
        openRate: sentCount > 0 ? Math.round((opens / sentCount) * 10000) / 100 : 0,
        clickRate: sentCount > 0 ? Math.round((clicks / sentCount) * 10000) / 100 : 0,
      };
    })
  );

  // Try to get stats from Brevo
  let campaignStats: CampaignStats = {
    sent: 0, delivered: 0, opened: 0, clicked: 0,
    softBounce: 0, hardBounce: 0, spam: 0, unsubscribed: 0,
    openRate: 0, clickRate: 0, bounceRate: 0, spamRate: 0,
    unsubscribeRate: 0, deliveredRate: 0,
  };

  try {
    const brevo = getBrevo();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const report = await brevo.transactional.getAggregatedReport({
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    });
    campaignStats = {
      sent: report.totalSent,
      delivered: report.totalDelivered,
      opened: report.totalOpened,
      clicked: report.totalClicked,
      softBounce: report.totalSoftBounce,
      hardBounce: report.totalHardBounce,
      spam: report.totalSpam,
      unsubscribed: report.totalUnsubscribed,
      openRate: report.openRate,
      clickRate: report.clickRate,
      bounceRate: report.bounceRate,
      spamRate: report.spamRate,
      unsubscribeRate: report.unsubscribeRate,
      deliveredRate: report.deliveredRate,
    };
  } catch {
    // Brevo optional
  }

  const recentActivity = [
    ...recentLogs.map((log) => ({
      id: log.id,
      action: "email_sent",
      entityType: "Email",
      entityName: log.subject || log.email,
      timestamp: log.createdAt.toISOString(),
      status: log.status,
    })),
    ...recentCampaigns.map((c) => ({
      id: c.id,
      action: c.sentAt ? "campaign_sent" : "campaign_created",
      entityType: "Campaign",
      entityName: c.name,
      timestamp: (c.sentAt || c.createdAt).toISOString(),
      status: c.status,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  return {
    totalSubscribers,
    activeSubscribers,
    totalContacts,
    transactionalEmailsSent,
    totalCampaigns,
    emailsSent: campaignStats.sent || totalCampaigns,
    openRate: campaignStats.openRate,
    clickRate: campaignStats.clickRate,
    bounceRate: campaignStats.bounceRate,
    spamRate: campaignStats.spamRate,
    totalUnsubscribes: unsubscribes,
    recentActivity,
    campaignPerformance,
  };
}

export async function getEmailAnalytics(
  dateFrom?: string,
  dateTo?: string
): Promise<AnalyticsData> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const end = dateTo ? new Date(dateTo) : new Date();
  const start = dateFrom
    ? new Date(dateFrom)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const defaultAnalytics: AnalyticsData = {
    dateRange: { start: start.toISOString(), end: end.toISOString() },
    aggregated: {
      sent: 0, delivered: 0, opened: 0, clicked: 0,
      softBounce: 0, hardBounce: 0, spam: 0, unsubscribed: 0,
      openRate: 0, clickRate: 0, bounceRate: 0, spamRate: 0,
      unsubscribeRate: 0, deliveredRate: 0,
    },
    dailyStats: [],
    campaignPerformance: [],
    subscriberGrowth: [],
    topCountries: [],
    topSources: [],
    devices: [],
    browsers: [],
  };

  try {
    const brevo = getBrevo();

    const [aggregated, dailyReport, campaigns, subscribers, contacts] = await Promise.all([
      brevo.transactional.getAggregatedReport({
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      }),
      brevo.transactional.getDailyReport({
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        limit: 90,
      }),
      prisma.campaign.findMany({
        where: { status: "SENT", sentAt: { gte: start, lte: end } },
        orderBy: { sentAt: "desc" },
        take: 20,
      }),
      prisma.subscriber.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: start, lte: end } },
        _count: true,
      }),
      prisma.contactListMember.groupBy({
        by: ["country"],
        _count: true,
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
    ]);

    const subscriberGrowthMap = new Map<string, { newSubscribers: number; unsubscribes: number }>();
    for (const s of subscribers) {
      const dateKey = s.createdAt.toISOString().split("T")[0];
      const entry = subscriberGrowthMap.get(dateKey) || { newSubscribers: 0, unsubscribes: 0 };
      entry.newSubscribers += s._count;
      subscriberGrowthMap.set(dateKey, entry);
    }

    const unsubscribed = await prisma.subscriber.findMany({
      where: {
        status: "UNSUBSCRIBED",
        updatedAt: { gte: start, lte: end },
      },
      select: { updatedAt: true },
    });
    for (const u of unsubscribed) {
      const dateKey = u.updatedAt.toISOString().split("T")[0];
      const entry = subscriberGrowthMap.get(dateKey) || { newSubscribers: 0, unsubscribes: 0 };
      entry.unsubscribes += 1;
      subscriberGrowthMap.set(dateKey, entry);
    }

    const sourceCounts = await prisma.subscriber.groupBy({
      by: ["source"],
      _count: true,
      orderBy: { _count: { source: "desc" } },
      take: 10,
    });

    return {
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      aggregated: {
        sent: aggregated.totalSent,
        delivered: aggregated.totalDelivered,
        opened: aggregated.totalOpened,
        clicked: aggregated.totalClicked,
        softBounce: aggregated.totalSoftBounce,
        hardBounce: aggregated.totalHardBounce,
        spam: aggregated.totalSpam,
        unsubscribed: aggregated.totalUnsubscribed,
        openRate: aggregated.openRate,
        clickRate: aggregated.clickRate,
        bounceRate: aggregated.bounceRate,
        spamRate: aggregated.spamRate,
        unsubscribeRate: aggregated.unsubscribeRate,
        deliveredRate: aggregated.deliveredRate,
      },
      dailyStats: (dailyReport.dailyStats || []).map((d) => ({
        date: d.date,
        sent: d.sent,
        delivered: d.delivered,
        opened: d.opened,
        clicked: d.clicked,
        bounced: d.softBounce + d.hardBounce,
        spam: d.spam,
        unsubscribed: d.unsubscribed,
      })),
      campaignPerformance: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        sent: 0,
        opened: 0,
        clicked: 0,
        openRate: 0,
        clickRate: 0,
      })),
      subscriberGrowth: Array.from(subscriberGrowthMap.entries()).map(([date, data]) => ({
        date,
        newSubscribers: data.newSubscribers,
        unsubscribes: data.unsubscribes,
      })),
      topCountries: contacts
        .filter((c) => c.country)
        .map((c) => ({ country: c.country!, count: c._count })),
      topSources: sourceCounts
        .filter((s) => s.source)
        .map((s) => ({ source: s.source!, count: s._count })),
      devices: [],
      browsers: [],
    };
  } catch {
    return defaultAnalytics;
  }
}
