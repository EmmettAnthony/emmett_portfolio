import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await checkRateLimit(request, "chat-conversation", 30, 60_000);
    if (!rl.passed) return rl.response;

    const { id } = await params;

    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        lead: true,
        feedback: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await checkRateLimit(request, "chat-conversation", 30, 60_000);
    if (!rl.passed) return rl.response;

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.chatConversation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.visitorName) updateData.visitorName = body.visitorName;
    if (body.visitorEmail) updateData.visitorEmail = body.visitorEmail;
    if (body.tags) updateData.tags = body.tags;
    if (body.isHighPriority !== undefined) updateData.isHighPriority = body.isHighPriority;
    if (body.metadata) updateData.metadata = body.metadata;

    const conversation = await prisma.chatConversation.update({
      where: { id },
      data: updateData,
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        lead: true,
        feedback: true,
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Failed to update conversation:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = await checkRateLimit(request, "chat-conversation", 30, 60_000);
    if (!rl.passed) return rl.response;

    const { id } = await params;

    const existing = await prisma.chatConversation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await prisma.chatConversation.delete({ where: { id } });

    return NextResponse.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
