import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();

    const [total, approved, pending, rejected, featured, archived, ratingAgg, monthly] = await Promise.all([
      prisma.testimonial.count(),
      prisma.testimonial.count({ where: { status: "APPROVED" } }),
      prisma.testimonial.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.testimonial.count({ where: { status: "REJECTED" } }),
      prisma.testimonial.count({ where: { featured: true } }),
      prisma.testimonial.count({ where: { archived: true } }),
      prisma.testimonial.aggregate({ _avg: { rating: true } }),
      prisma.testimonial.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: { createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    // Group by month
    const monthlyMap: Record<string, number> = {};
    for (const item of monthly) {
      const key = new Date(item.createdAt).toISOString().slice(0, 7);
      monthlyMap[key] = (monthlyMap[key] || 0) + item._count.id;
    }

    const monthlyData = Object.entries(monthlyMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      total,
      approved,
      pending,
      rejected,
      featured,
      archived,
      averageRating: ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : 0,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      monthlyData,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
