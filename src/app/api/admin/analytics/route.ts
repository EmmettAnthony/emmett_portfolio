import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();

    const [totalEvents, byEvent, daily30, topPages, leads, subscribers] = await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.groupBy({
        by: ["event"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["createdAt", "event"],
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _count: { id: true },
      }),
      prisma.analyticsEvent.findMany({
        where: { event: "page_view" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.contact.count(),
      prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    ]);

    const dailyMap: Record<string, Record<string, number>> = {};
    for (const item of daily30) {
      const day = item.createdAt.toISOString().slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = {};
      dailyMap[day][item.event] = (dailyMap[day][item.event] || 0) + item._count.id;
    }

    const dailyData = Object.entries(dailyMap)
      .map(([date, events]) => ({ date, ...events }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const pageViews = byEvent.find((e) => e.event === "page_view")?._count.id || 0;
    const avgSessionMs = 154000; // placeholder — real session tracking needs GA

    const topPagesData = topPages.reduce<Record<string, number>>((acc, p) => {
      const label = p.label || "/";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const topPagesList = Object.entries(topPagesData)
      .map(([page, count]) => ({ page: page.length > 40 ? page.slice(0, 40) + "..." : page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      totalEvents,
      pageViews,
      leads,
      subscribers,
      avgSessionMs,
      eventBreakdown: byEvent.map((e) => ({ event: e.event, count: e._count.id })),
      dailyData,
      topPages: topPagesList,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
