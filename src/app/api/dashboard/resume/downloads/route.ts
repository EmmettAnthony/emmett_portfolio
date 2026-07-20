import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

async function getResume() {
  return prisma.resumeProfile.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, byTemplate, last30Days] = await Promise.all([
      prisma.resumeDownload.count({
        where: { resumeId: resume.id },
      }),
      prisma.resumeDownload.groupBy({
        by: ["template"],
        where: { resumeId: resume.id },
        _count: { template: true },
      }),
      prisma.resumeDownload.findMany({
        where: {
          resumeId: resume.id,
          downloadedAt: { gte: thirtyDaysAgo },
        },
        orderBy: { downloadedAt: "asc" },
      }),
    ]);

    // Aggregate daily counts for last 30 days
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      dailyCounts[key] = 0;
    }

    for (const download of last30Days) {
      const key = download.downloadedAt.toISOString().split("T")[0];
      if (dailyCounts[key] !== undefined) {
        dailyCounts[key]++;
      }
    }

    const trend = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      total,
      byTemplate: byTemplate.map((t) => ({
        template: t.template,
        count: t._count.template,
      })),
      trend,
    });
  } catch (error) {
    console.error("Failed to fetch download stats:", error);
    return NextResponse.json({ error: "Failed to fetch download stats" }, { status: 500 });
  }
}
