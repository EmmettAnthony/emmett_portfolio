import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unsubscribeSchema } from "@/lib/validations/newsletter";
import { rateLimit } from "@/lib/rate-limit";
import { dispatchWebhook } from "@/lib/webhooks";
import type { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const { success: allowed } = await rateLimit(
    `unsubscribe:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`,
    10,
    60_000,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, reason, detail, campaignId } = parsed.data;
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (!existing) {
      return NextResponse.json({ message: "Not subscribed" }, { status: 200 });
    }

    await prisma.subscriber.update({
      where: { email },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribeReason: {
          upsert: {
            create: { reason: reason || null, detail: detail || null },
            update: { reason: reason || null, detail: detail || null },
          },
        },
      },
    });

    if (campaignId) {
      await prisma.campaignEvent.create({
        data: {
          campaignId,
          subscriberId: existing.id,
          email,
          eventType: "unsubscribed",
          metadata: { reason, detail },
        } as unknown as Prisma.CampaignEventCreateInput,
      }).catch(() => {});
    }

    try {
      await prisma.analyticsEvent.create({
        data: { event: "newsletter_unsubscribe", label: email },
      });
    } catch {}

    dispatchWebhook("unsubscribe", { email, reason: reason || null }).catch(() => {});

    return NextResponse.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const subscriber = await prisma.subscriber.findUnique({ where: { email } });
  const isSubscribed = subscriber?.status === "ACTIVE";
  return NextResponse.json({ isSubscribed, status: subscriber?.status || null });
}
