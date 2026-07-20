import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";

const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const subscriberId = searchParams.get("subscriberId");

    if (!campaignId || !subscriberId) {
      return new NextResponse(pixel, {
        headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache, no-store" },
      });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return new NextResponse(pixel, {
        headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache, no-store" },
      });
    }

    const subscriber = await prisma.subscriber.findUnique({ where: { id: subscriberId } });
    if (!subscriber) {
      return new NextResponse(pixel, {
        headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache, no-store" },
      });
    }

    await Promise.all([
      prisma.campaignEvent.create({
        data: {
          campaignId,
          subscriberId,
          email: subscriber.email,
          eventType: "opened",
          metadata: {},
        },
      }),
      prisma.subscriber.update({
        where: { id: subscriberId },
        data: { lastOpenedAt: new Date() },
      }),
      prisma.emailLog.updateMany({
        where: { campaignId, subscriberId, status: { notIn: ["bounced", "failed"] } },
        data: { status: "opened", openedAt: new Date() },
      }),
    ]);

    cache.invalidate(`newsletter:campaign-daily:${campaignId}`);

    return new NextResponse(pixel, {
      headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache, no-store" },
    });
  } catch {
    return new NextResponse(pixel, {
      headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache, no-store" },
    });
  }
}
