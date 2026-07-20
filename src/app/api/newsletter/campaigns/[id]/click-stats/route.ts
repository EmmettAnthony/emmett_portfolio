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

    const CACHE_KEY = `newsletter:campaign-clicks:${id}`;
    const cached = cache.get(CACHE_KEY);
    if (cached) return NextResponse.json(cached);

    const clickEvents = await prisma.campaignEvent.findMany({
      where: { campaignId: id, eventType: "clicked" },
      select: {
        metadata: true,
        createdAt: true,
        email: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const linkMap = new Map<string, { url: string; clicks: number; uniqueEmails: Set<string>; lastClicked: Date }>();

    for (const event of clickEvents) {
      const meta = event.metadata as { url?: string } | null;
      const url = meta?.url || "unknown";
      if (!linkMap.has(url)) {
        linkMap.set(url, { url, clicks: 0, uniqueEmails: new Set(), lastClicked: event.createdAt });
      }
      const entry = linkMap.get(url)!;
      entry.clicks++;
      entry.uniqueEmails.add(event.email);
      if (event.createdAt > entry.lastClicked) entry.lastClicked = event.createdAt;
    }

    const links = Array.from(linkMap.values())
      .map((l) => ({
        url: l.url,
        clicks: l.clicks,
        uniqueClicks: l.uniqueEmails.size,
        lastClicked: l.lastClicked.toISOString(),
      }))
      .sort((a, b) => b.clicks - a.clicks);

    cache.set(CACHE_KEY, { links, totalClicks: clickEvents.length });
    return NextResponse.json({ links, totalClicks: clickEvents.length });
  } catch (error) {
    console.error("Failed to fetch click stats:", error);
    return NextResponse.json({ error: "Failed to fetch click stats" }, { status: 500 });
  }
}
