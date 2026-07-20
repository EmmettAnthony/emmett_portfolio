import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { chatLeadSchema } from "@/lib/validations/chatbot";
import { trackLeadGenerated } from "@/lib/chatbot/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.chatLead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          conversation: {
            include: {
              _count: { select: { messages: true } },
            },
          },
        },
      }),
      prisma.chatLead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "chat-leads", 30, 60_000);
    if (!rl.passed) return rl.response;

    const body = await request.json();
    const parsed = chatLeadSchema.parse(body);

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: parsed.conversationId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const existing = await prisma.chatLead.findUnique({
      where: { conversationId: parsed.conversationId },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const lead = await prisma.chatLead.create({
      data: {
        conversationId: parsed.conversationId,
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone ?? null,
        company: parsed.company ?? null,
        budget: parsed.budget ?? null,
        timeline: parsed.timeline ?? null,
        requirements: parsed.requirements,
        projectType: parsed.projectType ?? null,
        industry: parsed.industry ?? null,
        preferredContact: parsed.preferredContact ?? null,
        leadScore: 50,
        priority: "MEDIUM",
        status: "NEW",
      },
    });

    await prisma.chatConversation.update({
      where: { id: parsed.conversationId },
      data: { leadId: lead.id },
    });

    await trackLeadGenerated();

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Failed to create lead:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
