import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { statusId } = await request.json();

    if (!statusId) {
      return NextResponse.json({ error: "statusId is required" }, { status: 400 });
    }

    const status = await prisma.supportStatus.findUnique({ where: { id: statusId } });
    if (!status) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }

    const oldTicket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { statusId: true, ticketNumber: true },
    });

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { statusId },
      include: {
        status: { select: { name: true, color: true } },
        priority: { select: { name: true, color: true } },
      },
    });

    await logActivity({
      module: "crm",
      entity: "SupportTicket",
      entityId: ticket.id,
      action: "status_changed",
      description: `Ticket ${ticket.ticketNumber} status changed to ${status.name}`,
      metadata: {
        ticketId: ticket.id,
        fromStatus: oldTicket?.statusId ?? null,
        toStatus: statusId,
      },
    });

    return NextResponse.json({ ticket });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
