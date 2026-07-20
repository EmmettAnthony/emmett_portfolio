import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "chat-conversations", 30, 60_000);
    if (!rl.passed) return rl.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { visitorName: { contains: search, mode: "insensitive" } },
        { visitorEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.chatConversation.findMany({
        where,
        orderBy: { lastActivityAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { messages: true } },
          lead: true,
          feedback: true,
        },
      }),
      prisma.chatConversation.count({ where }),
    ]);

    return NextResponse.json({
      conversations,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "chat-conversations", 30, 60_000);
    if (!rl.passed) return rl.response;

    const body = await request.json();
    const { source, visitorId, visitorName, visitorEmail, metadata } = body;

    const conversation = await prisma.chatConversation.create({
      data: {
        source: source || "chat_widget",
        visitorId: visitorId || null,
        visitorName: visitorName || null,
        visitorEmail: visitorEmail || null,
        metadata: metadata || undefined,
        status: "ACTIVE",
        language: "en",
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
