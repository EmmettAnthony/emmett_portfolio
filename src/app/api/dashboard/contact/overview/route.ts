import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      total,
      byStatus,
      newThisMonth,
      avgScore,
      recentSubmissions,
      sourceBreakdown,
      statusConversion,
      projectTypeDistribution,
      budgetDistribution,
      monthlyTrend,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.contact.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      prisma.contact.aggregate({
        _avg: { leadScore: true },
        _max: { leadScore: true },
      }),
      prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          email: true,
          projectType: true,
          leadScore: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.contact.groupBy({
        by: ["referralSource"],
        _count: { id: true },
        where: { referralSource: { not: null } },
      }),
      prisma.contact.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.contact.groupBy({
        by: ["projectType"],
        _count: { id: true },
      }),
      prisma.contact.groupBy({
        by: ["budget"],
        _count: { id: true },
        where: { budget: { not: null } },
      }),
      prisma.contact.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const item of byStatus) {
      statusBreakdown[item.status] = item._count;
    }

    const faqCount = await prisma.contactFaq.count();

    return NextResponse.json({
      total,
      newThisMonth,
      avgScore: Math.round((avgScore._avg.leadScore ?? 0) * 10) / 10,
      maxScore: avgScore._max.leadScore ?? 0,
      statusBreakdown,
      recentSubmissions,
      faqCount,
      sourceBreakdown,
      statusConversion,
      projectTypeDistribution,
      budgetDistribution,
      monthlyTrend,
    });
  } catch (error) {
    console.error("Failed to fetch contact overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview" },
      { status: 500 }
    );
  }
}
