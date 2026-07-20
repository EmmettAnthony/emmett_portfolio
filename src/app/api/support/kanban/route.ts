import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const statuses = await prisma.supportStatus.findMany({
      orderBy: { order: "asc" },
    });

    const columns = await Promise.all(
      statuses.map(async (status) => {
        const tickets = await prisma.supportTicket.findMany({
          where: { statusId: status.id },
          include: {
            priority: { select: { name: true, color: true } },
            assignedTo: { select: { name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 50,
        });
        return {
          id: status.id,
          name: status.name,
          tickets: tickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            subject: t.subject,
            fullName: t.fullName,
            priority: {
              name: t.priority?.name ?? "Normal",
              color: t.priority?.color ?? "",
            },
            status: {
              id: status.id,
              name: status.name,
              color: status.color || "",
              bgColor: "",
            },
            createdAt: t.createdAt.toISOString(),
            assignedTo: t.assignedTo,
          })),
        };
      })
    );

    return NextResponse.json({ columns });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
