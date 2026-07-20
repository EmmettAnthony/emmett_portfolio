import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { fetchRssFeed, buildRssEmailHtml } from "@/lib/rss";
import { sendCampaignEmail } from "@/lib/email";
import { notifyCampaignSent } from "@/lib/notifications/event-handlers";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { feedUrl, campaignName, subjectLine } = body;

    if (!feedUrl) {
      return NextResponse.json({ error: "feedUrl is required" }, { status: 400 });
    }

    const items = await fetchRssFeed(feedUrl, 10);
    if (items.length === 0) {
      return NextResponse.json({ error: "No items found in feed" }, { status: 404 });
    }

    const name = campaignName || `RSS Digest: ${new Date().toLocaleDateString()}`;
    const subject = subjectLine || items[0].title || "Latest Updates";
    const html = buildRssEmailHtml(items, name);

    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        content: html,
        status: "DRAFT",
      },
    });

    const subscribers = await prisma.subscriber.findMany({
      where: { status: "ACTIVE" },
    });

    if (subscribers.length > 0) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "SENDING" },
      });

      let sentCount = 0;
      for (const subscriber of subscribers) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma types differ
          const result = await sendCampaignEmail(campaign as any, subscriber as any, {
            trackOpens: true,
            unsubscribeFooter: null,
          });

          if (result.success) {
            await prisma.emailLog.create({
              data: {
                campaignId: campaign.id,
                subscriberId: subscriber.id,
                email: subscriber.email,
                subject,
                status: "sent",
                sentAt: new Date(),
                resendId: result.data?.id || null,
              } as any, // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma type mismatch
            });
            await prisma.campaignEvent.create({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma type mismatch
              data: { campaignId: campaign.id, subscriberId: subscriber.id, email: subscriber.email, eventType: "sent" } as any,
            });
            sentCount++;
          }
        } catch {
          // skip failed
        }
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "SENT", sentAt: new Date(), completedAt: new Date(), totalRecipients: sentCount },
      });

      await notifyCampaignSent(name, sentCount).catch(() => {});
    }

    return NextResponse.json({ campaignId: campaign.id, items: items.length, sent: subscribers.length });
  } catch (error) {
    console.error("Failed to process RSS feed:", error);
    return NextResponse.json({ error: "Failed to process RSS feed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const feedUrl = searchParams.get("url");
    if (!feedUrl) return NextResponse.json({ error: "url param required" }, { status: 400 });

    const items = await fetchRssFeed(feedUrl, 10);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to preview RSS feed:", error);
    return NextResponse.json({ error: "Failed to preview feed" }, { status: 500 });
  }
}
