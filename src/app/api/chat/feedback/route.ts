import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatFeedbackSchema } from "@/lib/validations/chatbot";
import { updateSatisfactionScore } from "@/lib/chatbot/analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [feedbacks, total] = await Promise.all([
      prisma.chatFeedback.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          conversation: {
            select: { id: true, visitorName: true, source: true },
          },
        },
      }),
      prisma.chatFeedback.count(),
    ]);

    return NextResponse.json({ feedbacks, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = chatFeedbackSchema.parse(body);

    // Verify conversation exists
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: parsed.conversationId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check if feedback already exists for this conversation
    const existing = await prisma.chatFeedback.findUnique({
      where: { conversationId: parsed.conversationId },
    });
    if (existing) {
      return NextResponse.json({ error: "Feedback already exists for this conversation" }, { status: 409 });
    }

    const feedback = await prisma.chatFeedback.create({
      data: {
        conversationId: parsed.conversationId,
        score: parsed.score,
        comment: parsed.comment ?? null,
        category: parsed.category ?? null,
      },
    });

    // Update conversation feedback score
    await prisma.chatConversation.update({
      where: { id: parsed.conversationId },
      data: { feedbackScore: parsed.score },
    });

    // Update analytics satisfaction score
    await updateSatisfactionScore(parsed.score);

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
