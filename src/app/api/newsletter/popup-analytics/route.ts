import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export type PopupAnalyticsData = {
  totalShown: number;
  totalDismissed: number;
  totalConverted: number;
  conversionRate: number;
  dismissRate: number;
  byTrigger: { trigger: string; count: number }[];
  byPage: { page: string; count: number }[];
  dailyData: { date: string; shown: number; dismissed: number; converted: number }[];
  todayShown: number;
  todayDismissed: number;
  todayConverted: number;
};

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch all popup analytics events
    const [shownEvents, dismissedEvents, convertedEvents] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { event: "popup_shown" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.analyticsEvent.findMany({
        where: { event: "popup_dismissed" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.analyticsEvent.findMany({
        where: { event: "popup_converted" },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalShown = shownEvents.length;
    const totalDismissed = dismissedEvents.length;
    const totalConverted = convertedEvents.length;

    // Today's counts
    const todayShown = shownEvents.filter((e) => e.createdAt >= todayStart).length;
    const todayDismissed = dismissedEvents.filter((e) => e.createdAt >= todayStart).length;
    const todayConverted = convertedEvents.filter((e) => e.createdAt >= todayStart).length;

    // Aggregate by trigger type
    const triggerMap = new Map<string, number>();
    for (const event of shownEvents) {
      const trigger = (event.metadata as { trigger?: string })?.trigger ?? "unknown";
      triggerMap.set(trigger, (triggerMap.get(trigger) || 0) + 1);
    }
    const byTrigger = Array.from(triggerMap.entries())
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate by page
    const pageMap = new Map<string, number>();
    for (const event of shownEvents) {
      const page = (event.metadata as { pathname?: string })?.pathname ?? "unknown";
      pageMap.set(page, (pageMap.get(page) || 0) + 1);
    }
    const byPage = Array.from(pageMap.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);

    // Build daily time series (last 30 days)
    const dailyMap = new Map<string, { shown: number; dismissed: number; converted: number }>();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { shown: 0, dismissed: 0, converted: 0 });
    }

    for (const e of shownEvents) {
      if (e.createdAt >= thirtyDaysAgo) {
        const key = e.createdAt.toISOString().split("T")[0];
        const entry = dailyMap.get(key);
        if (entry) entry.shown++;
      }
    }
    for (const e of dismissedEvents) {
      if (e.createdAt >= thirtyDaysAgo) {
        const key = e.createdAt.toISOString().split("T")[0];
        const entry = dailyMap.get(key);
        if (entry) entry.dismissed++;
      }
    }
    for (const e of convertedEvents) {
      if (e.createdAt >= thirtyDaysAgo) {
        const key = e.createdAt.toISOString().split("T")[0];
        const entry = dailyMap.get(key);
        if (entry) entry.converted++;
      }
    }

    const dailyData = Array.from(dailyMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return NextResponse.json({
      totalShown,
      totalDismissed,
      totalConverted,
      conversionRate: totalShown > 0 ? totalConverted / totalShown : 0,
      dismissRate: totalShown > 0 ? totalDismissed / totalShown : 0,
      byTrigger,
      byPage,
      dailyData,
      todayShown,
      todayDismissed,
      todayConverted,
    } satisfies PopupAnalyticsData);
  } catch (error) {
    console.error("Failed to fetch popup analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch popup analytics" },
      { status: 500 }
    );
  }
}
