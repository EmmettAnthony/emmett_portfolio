import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const [
      totalProjects,
      publishedProjects,
      draftProjects,
      featuredProjects,
      totalCategories,
      totalTechnologies,
      totalViews,
      mostViewed,
      projectsByCategory,
      technologyUsage,
      viewTrend,
    ] = await Promise.all([
      prisma.portfolioProject.count(),
      prisma.portfolioProject.count({ where: { published: true } }),
      prisma.portfolioProject.count({ where: { status: "DRAFT" } }),
      prisma.portfolioProject.count({ where: { featured: true } }),
      prisma.portfolioCategory.count(),
      prisma.technology.count(),
      prisma.portfolioProject.aggregate({
        _sum: { viewCount: true },
      }),
      prisma.portfolioProject.findMany({
        orderBy: { viewCount: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
        },
      }),
      prisma.portfolioCategory.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { projects: true } },
        },
        orderBy: { order: "asc" },
      }),
      prisma.technology.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          _count: { select: { projects: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.projectDailyView.groupBy({
        by: ["date"],
        _sum: { count: true },
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: "asc" },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalProjects,
        publishedProjects,
        draftProjects,
        featuredProjects,
        totalCategories,
        totalTechnologies,
        totalViews: totalViews._sum.viewCount ?? 0,
      },
      mostViewed,
      projectsByCategory,
      technologyUsage,
      viewTrend,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
