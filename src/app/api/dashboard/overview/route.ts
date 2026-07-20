import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { cache } from "@/lib/cache";
import { buildOverviewResult } from "@/lib/overview";

const CACHE_TTL = 30_000; // 30 seconds
const CACHE_KEY = "dashboard:overview";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check cache first
  const cached = cache.get<Record<string, unknown>>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const prisma = getPrisma();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Week-over-week comparison ranges
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const twoWeeksAgoStart = new Date(today);
    twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 14);
    const twoWeeksAgoEnd = new Date(today);
    twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() - 7);
    twoWeeksAgoEnd.setHours(23, 59, 59, 999);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    thisWeekStart.setHours(0, 0, 0, 0);

    const now = new Date();

    const [
      // Stats
      totalLeads,
      contacts,
      activeProjects,
      blogPosts,
      totalSubscribers,
      // Calendar KPIs — current
      todayEventCount,
      upcomingApptCount,
      overdueTasks,
      // Calendar KPIs — last week for trends
      lastWeekTodayEventCount,
      appointmentsCreatedThisWeek,
      appointmentsCreatedPrevWeek,
      tasksOverdueThisWeek,
      tasksOverduePrevWeek,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.findMany({ select: { status: true } }),
      prisma.project.count(),
      prisma.blogPost.count(),
      prisma.subscriber.count({ where: { status: "ACTIVE" } }),
      // Today's events
      prisma.calendarEvent.count({
        where: {
          startDate: { gte: today },
          endDate: { lte: todayEnd },
        },
      }),
      // Upcoming appointments (PENDING or CONFIRMED)
      prisma.appointment.count({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      // Overdue tasks (not completed, past due date)
      prisma.calendarTask.count({
        where: {
          status: { notIn: ["COMPLETED", "ARCHIVED"] },
          dueDate: { lt: new Date() },
        },
      }),
      // Last week same-day events
      prisma.calendarEvent.count({
        where: {
          startDate: { gte: lastWeekStart },
          endDate: { lte: lastWeekEnd },
        },
      }),
      // Appointments created this week (last 7 days)
      prisma.appointment.count({
        where: { createdAt: { gte: thisWeekStart } },
      }),
      // Appointments created previous week (7-14 days ago)
      prisma.appointment.count({
        where: {
          createdAt: { gte: twoWeeksAgoStart, lt: thisWeekStart },
        },
      }),
      // Tasks that became overdue this week
      prisma.calendarTask.count({
        where: {
          status: { notIn: ["COMPLETED", "ARCHIVED"] },
          dueDate: { gte: thisWeekStart, lt: now },
        },
      }),
      // Tasks that became overdue previous week
      prisma.calendarTask.count({
        where: {
          status: { notIn: ["COMPLETED", "ARCHIVED"] },
          dueDate: { gte: twoWeeksAgoStart, lt: thisWeekStart },
        },
      }),
    ]);

    // Newsletter analytics — only the fields used on the overview page
    const [
      sentCampaigns,
      totalSentEvents,
      totalOpens,
      totalClicks,
    ] = await Promise.all([
      prisma.campaign.count({ where: { status: "SENT" } }),
      prisma.campaignEvent.count({ where: { eventType: "sent" } }),
      prisma.campaignEvent.count({ where: { eventType: "opened" } }),
      prisma.campaignEvent.count({ where: { eventType: "clicked" } }),
    ]);

    // Campaign performance — last 5 sent campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { status: "SENT" },
      select: { id: true, name: true, totalRecipients: true },
      orderBy: { sentAt: "desc" },
      take: 5,
    });

    const campaignPerformance = await Promise.all(
      campaigns.map(async (c) => {
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

    const result = buildOverviewResult({
      totalLeads,
      contacts,
      activeProjects,
      blogPosts,
      newsletterSubscribers: totalSubscribers,
      sentCampaigns,
      totalSentEvents,
      totalOpens,
      totalClicks,
      campaignPerformance,
      todayEventCount,
      upcomingApptCount,
      overdueTasks,
      lastWeekTodayEventCount,
      appointmentsCreatedThisWeek,
      appointmentsCreatedPrevWeek,
      tasksOverdueThisWeek,
      tasksOverduePrevWeek,
    });

    cache.set(CACHE_KEY, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({
      totalLeads: 0, newLeads: 0, conversionRate: 0,
      activeProjects: 0, blogPosts: 0, newsletterSubscribers: 0,
      sentCampaigns: 0, overallOpenRate: 0, overallClickRate: 0,
      campaignPerformance: [],
      activeSubscribers: 0,
      todayEventCount: 0, upcomingApptCount: 0, overdueTaskCount: 0,
    });
  }
}
