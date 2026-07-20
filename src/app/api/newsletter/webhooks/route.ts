import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(webhooks);
  } catch (error) {
    console.error("Failed to fetch webhooks:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { url, events, secret, active } = body;

    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    if (!events) return NextResponse.json({ error: "Events are required" }, { status: 400 });

    const webhook = await prisma.webhook.create({
      data: {
        url,
        events,
        secret: secret || null,
        active: active ?? true,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
