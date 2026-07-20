import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30";
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (startParam && endParam) {
      startDate = new Date(startParam);
      endDate = new Date(endParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const days = parseInt(period);
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    }

    // Query conversion data: how many triggered conversations resulted in messages or leads
    const allConversationsWithMetadata = await prisma.chatConversation.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON filter
        metadata: { not: null } as any,
      },
      select: {
        id: true,
        metadata: true,
        messageCount: true,
        leadId: true,
      },
    });

    // Filter client-side for triggeredBy since Prisma JSON path queries can be finicky
    const triggeredConversations = allConversationsWithMetadata.filter(
      (c) => (c.metadata as Record<string, unknown>)?.triggeredBy != null
    );

    const welcomeTriggered = triggeredConversations.filter(
      (c) => ((c.metadata as Record<string, unknown>)?.triggeredBy as string) === "welcome"
    );
    const exitIntentTriggered = triggeredConversations.filter(
      (c) => ((c.metadata as Record<string, unknown>)?.triggeredBy as string) === "exit-intent"
    );

    // A "converted" triggered visitor sent at least 1 real message (messageCount > 1
    // because the trigger sends 1 message, so messageCount >= 2 means they replied)
    const welcomeConversions = welcomeTriggered.filter((c) => c.messageCount >= 2).length;
    const exitIntentConversions = exitIntentTriggered.filter((c) => c.messageCount >= 2).length;
    const welcomeLeadConversions = welcomeTriggered.filter((c) => c.leadId).length;
    const exitIntentLeadConversions = exitIntentTriggered.filter((c) => c.leadId).length;

    const [dailyStats, totalConversations, activeConversations, totalLeads, totalMessages, avgSatisfaction, triggerAgg] =
      await Promise.all([
        prisma.chatAnalytics.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: "asc" },
        }),
        prisma.chatConversation.count(),
        prisma.chatConversation.count({ where: { status: "ACTIVE" } }),
        prisma.chatLead.count(),
        prisma.chatMessage.count(),
        prisma.chatFeedback.aggregate({ _avg: { score: true } }),
        prisma.chatAnalytics.aggregate({
          _sum: {
            welcomeTriggerCount: true,
            exitIntentTriggerCount: true,
          },
        }),
      ]);

    // Gather topic distribution from conversation tags
    const recentConversations = await prisma.chatConversation.findMany({
      where: { createdAt: { gte: startDate, lte: endDate }, tags: { isEmpty: false } },
      select: { tags: true },
    });

    const topicCount: Record<string, number> = {};
    recentConversations.forEach((c) => {
      c.tags.forEach((tag) => {
        topicCount[tag] = (topicCount[tag] || 0) + 1;
      });
    });

    const topTopics = Object.entries(topicCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    // Build time-series data
    const conversationsOverTime = dailyStats.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      count: d.totalConversations,
      messages: d.totalMessages,
      leads: d.leadsGenerated,
    }));

    // Build trigger trends (welcome + exit intent per day)
    const triggerTrends = dailyStats.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      welcomeTriggers: d.welcomeTriggerCount,
      exitIntentTriggers: d.exitIntentTriggerCount,
    }));

    // Build response time and session duration data
    const responseTimeData = dailyStats.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      avgResponseTime: Math.round(d.avgResponseTime * 10) / 10,
      avgSessionDuration: Math.round(d.avgSessionDuration * 10) / 10,
    }));

    // Build satisfaction trend
    const satisfactionTrend = dailyStats.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      satisfactionScore: Math.round(d.satisfactionScore * 10) / 10,
    }));

    const welcomeTriggerCount = triggerAgg._sum.welcomeTriggerCount ?? 0;
    const exitIntentTriggerCount = triggerAgg._sum.exitIntentTriggerCount ?? 0;

    return NextResponse.json({
      overview: {
        totalConversations,
        activeConversations,
        totalLeads,
        totalMessages,
        avgSatisfaction: avgSatisfaction._avg.score ?? 0,
        conversionRate: totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0,
        welcomeTriggerCount,
        exitIntentTriggerCount,
        welcomeTriggerConversions: welcomeConversions,
        exitIntentConversions,
        welcomeTriggerLeadConversions: welcomeLeadConversions,
        exitIntentLeadConversions,
        totalWelcomeTriggered: welcomeTriggered.length,
        totalExitIntentTriggered: exitIntentTriggered.length,
      },
      dailyStats,
      topTopics,
      conversationsOverTime,
      triggerTrends,
      responseTimeData,
      satisfactionTrend,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
