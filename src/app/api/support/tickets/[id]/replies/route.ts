import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { replyToTicketAction } from "@/actions/support/tickets";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const replies = await prisma.supportReply.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { name: true, avatar: true } }, attachments: { select: { id: true, fileName: true, url: true } } },
    });
    return NextResponse.json({ replies });
  } catch (error) {
    console.error("GET /api/support/tickets/[id]/replies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await replyToTicketAction({ ticketId: id, body: body.body, isInternal: body.isInternal ?? false, isStaff: true, staffName: body.staffName || "Staff" });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("POST /api/support/tickets/[id]/replies error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to reply" }, { status: 400 });
  }
}
