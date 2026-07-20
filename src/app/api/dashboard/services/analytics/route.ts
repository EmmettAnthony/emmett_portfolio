import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalServices,
      publishedServices,
      totalInquiries,
      inquiriesByStatus,
      inquiriesOverTimeRaw,
      rawServices,
      convertedCount,
      rawTopServices,
    ] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { published: true } }),
      prisma.serviceInquiry.count(),
      prisma.serviceInquiry.groupBy({ by: ["status"], _count: true }),
      prisma.serviceInquiry.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.service.findMany({
        where: { published: true },
        orderBy: { viewCount: "desc" },
        take: 10,
        select: { id: true, title: true, slug: true, icon: true, viewCount: true },
      }),
      prisma.serviceInquiry.count({ where: { status: "CONVERTED" } }),
      prisma.service.findMany({
        where: { published: true },
        orderBy: { viewCount: "desc" },
        take: 10,
        select: {
          id: true, title: true, slug: true, icon: true, viewCount: true,
          _count: { select: { inquiries: true } },
        },
      }),
    ]);

    const inquiriesOverTimeMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split("T")[0];
      inquiriesOverTimeMap.set(key, 0);
    }
    for (const inquiry of inquiriesOverTimeRaw) {
      const key = inquiry.createdAt.toISOString().split("T")[0];
      inquiriesOverTimeMap.set(key, (inquiriesOverTimeMap.get(key) ?? 0) + 1);
    }
    const inquiriesOverTime = Array.from(inquiriesOverTimeMap.entries()).map(
      ([date, count]) => ({ date, count })
    );

    const servicesByViews = rawServices.map((s) => ({
      id: s.id,
      title: s.title,
      views: s.viewCount,
    }));

    const topServices = rawTopServices.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      icon: s.icon,
      viewCount: s.viewCount,
      inquiryCount: s._count.inquiries,
      conversionRate: s.viewCount > 0
        ? Math.round((s._count.inquiries / s.viewCount) * 100)
        : 0,
    }));

    const draft = totalServices - publishedServices;

    return NextResponse.json({
      stats: {
        total: totalServices,
        published: publishedServices,
        draft,
        totalInquiries,
        conversionRate: totalInquiries > 0
          ? Math.round((convertedCount / totalInquiries) * 100)
          : 0,
      },
      inquiriesOverTime,
      servicesByViews,
      inquiryStatusBreakdown: inquiriesByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      topServices,
    });
  } catch (error) {
    console.error("Failed to fetch service analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch service analytics" },
      { status: 500 }
    );
  }
}
