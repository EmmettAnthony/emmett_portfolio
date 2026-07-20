import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !["welcome", "exit-intent"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === "welcome") {
      await prisma.chatAnalytics.upsert({
        where: { date: today },
        update: { welcomeTriggerCount: { increment: 1 } },
        create: {
          date: today,
          welcomeTriggerCount: 1,
          totalConversations: 0,
          totalMessages: 0,
        },
      });
    } else {
      await prisma.chatAnalytics.upsert({
        where: { date: today },
        update: { exitIntentTriggerCount: { increment: 1 } },
        create: {
          date: today,
          exitIntentTriggerCount: 1,
          totalConversations: 0,
          totalMessages: 0,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Non-critical — silently ignore tracking failures
    return NextResponse.json({ ok: true });
  }
}
