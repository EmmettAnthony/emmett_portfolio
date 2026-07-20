import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const resume = await prisma.resumeProfile.findFirst({ orderBy: { createdAt: "desc" } });
    if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 404 });

    const body = await request.json();
    const { section } = body;

    if (!section || typeof section !== "string") {
      return NextResponse.json({ error: "section is required" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.resumeSectionView.upsert({
      where: {
        resumeId_section_date: {
          resumeId: resume.id,
          section,
          date: today,
        },
      },
      update: { count: { increment: 1 } },
      create: {
        resumeId: resume.id,
        section,
        date: today,
        count: 1,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to log section view:", error);
    return NextResponse.json({ error: "Failed to log section view" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const resume = await prisma.resumeProfile.findFirst({ orderBy: { createdAt: "desc" } });
    if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 404 });

    const views = await prisma.resumeSectionView.findMany({
      where: { resumeId: resume.id },
      orderBy: { date: "desc" },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentViews = views.filter((v) => v.date >= thirtyDaysAgo);

    const bySection: Record<string, { total: number; daily: { date: string; count: number }[] }> = {};
    for (const v of views) {
      if (!bySection[v.section]) bySection[v.section] = { total: 0, daily: [] };
      bySection[v.section].total += v.count;
      bySection[v.section].daily.push({
        date: v.date.toISOString().split("T")[0],
        count: v.count,
      });
    }

    const sections = Object.entries(bySection)
      .map(([section, data]) => ({
        section,
        total: data.total,
        daily: data.daily,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      sections,
      totalViews: views.reduce((sum, v) => sum + v.count, 0),
      recentViews: recentViews.reduce((sum, v) => sum + v.count, 0),
    });
  } catch (error) {
    console.error("Failed to fetch section views:", error);
    return NextResponse.json({ error: "Failed to fetch section views" }, { status: 500 });
  }
}
