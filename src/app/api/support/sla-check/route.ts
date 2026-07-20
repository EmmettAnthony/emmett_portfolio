import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: {
        closedAt: null,
        status: { isClosed: false },
        priority: { slaHours: { not: null } },
      },
      include: { priority: { select: { name: true, slaHours: true } }, status: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const breached: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const atRisk: any[] = [];
    const now = new Date();

    for (const ticket of tickets) {
      if (!ticket.priority?.slaHours) continue;
      const deadline = new Date(ticket.createdAt.getTime() + ticket.priority.slaHours * 3600000);
      const hoursLeft = (deadline.getTime() - now.getTime()) / 3600000;
      if (hoursLeft <= 0) {
        breached.push({ id: ticket.id, ticketNumber: ticket.ticketNumber, subject: ticket.subject, priority: ticket.priority.name, deadline: deadline.toISOString() });
      } else if (hoursLeft <= ticket.priority.slaHours * 0.25) {
        atRisk.push({ id: ticket.id, ticketNumber: ticket.ticketNumber, subject: ticket.subject, priority: ticket.priority.name, hoursLeft: Math.round(hoursLeft * 10) / 10, deadline: deadline.toISOString() });
      }
    }

    return NextResponse.json({ breached, atRisk, total: tickets.length, checkedAt: now.toISOString() });
  } catch (error) {
    console.error("GET /api/support/sla-check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
