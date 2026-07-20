import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { updateTicketAction } from "@/actions/support/tickets";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ticket = await prisma.supportTicket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
      include: {
        category: true,
        priority: true,
        status: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, email: true } },
            attachments: true,
          },
        },
        attachments: true,
        ratings: true,
      },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    return NextResponse.json(ticket);
  } catch (error) {
    console.error("GET /api/support/tickets/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await updateTicketAction({ ...body, id });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("PATCH /api/support/tickets/[id] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Validation failed") || message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
