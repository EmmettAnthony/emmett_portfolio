import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const subscriberId = searchParams.get("subscriberId");
    const url = searchParams.get("url");

    if (!campaignId || !subscriberId || !url) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const decodedUrl = decodeURIComponent(url);

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.redirect(decodedUrl);
    }

    const subscriber = await prisma.subscriber.findUnique({ where: { id: subscriberId } });
    if (!subscriber) {
      return NextResponse.redirect(decodedUrl);
    }

    await Promise.all([
      prisma.campaignEvent.create({
        data: {
          campaignId,
          subscriberId,
          email: subscriber.email,
          eventType: "clicked",
          metadata: { url: decodedUrl },
        },
      }),
      prisma.subscriber.update({
        where: { id: subscriberId },
        data: { lastClickedAt: new Date() },
      }),
      prisma.emailLog.updateMany({
        where: { campaignId, subscriberId, status: { in: ["sent", "opened"] } },
        data: { status: "clicked", clickedAt: new Date() },
      }),
    ]);

    cache.invalidate(`newsletter:campaign-daily:${campaignId}`);
    cache.invalidate(`newsletter:campaign-clicks:${campaignId}`);

    return NextResponse.redirect(decodedUrl);
  } catch {
    const { searchParams } = new URL(request.url);
    const fallbackUrl = searchParams.get("url");
    return NextResponse.redirect(fallbackUrl ? decodeURIComponent(fallbackUrl) : "/");
  }
}
