import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const CACHE_KEY = `newsletter:campaign-daily:${id}`;
    const cached = cache.get(CACHE_KEY);
    if (cached) return NextResponse.json(cached);

    const events = await prisma.campaignEvent.findMany({
      where: { campaignId: id },
      select: { eventType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyMap: Record<string, { date: string; opens: number; clicks: number; sent: number }> = {};

    for (const event of events) {
      const key = event.createdAt.toISOString().split("T")[0];
      if (!dailyMap[key]) {
        dailyMap[key] = { date: key, opens: 0, clicks: 0, sent: 0 };
      }
      if (event.eventType === "opened") dailyMap[key].opens++;
      if (event.eventType === "clicked") dailyMap[key].clicks++;
      if (event.eventType === "sent") dailyMap[key].sent++;
    }

    const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    cache.set(CACHE_KEY, dailyData);
    return NextResponse.json(dailyData);
  } catch (error) {
    console.error("Failed to fetch daily stats:", error);
    return NextResponse.json({ error: "Failed to fetch daily stats" }, { status: 500 });
  }
}
