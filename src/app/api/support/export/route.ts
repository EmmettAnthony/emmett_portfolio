import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const statusId = searchParams.get("statusId");
  const priorityId = searchParams.get("priorityId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (statusId) where.statusId = statusId;
  if (priorityId) where.priorityId = priorityId;

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: { status: true, priority: true, category: true, assignedTo: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = tickets.map((t) => ({
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    fullName: t.fullName,
    email: t.email,
    status: t.status.name,
    priority: t.priority?.name || "",
    category: t.category?.name || "",
    assignedTo: t.assignedTo?.name || "",
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  if (format === "json") {
    return NextResponse.json(rows);
  }

  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(","),
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
    ...rows.map((r) => headers.map((h) => `"${String((r as any)[h] || "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="support-tickets-${Date.now()}.csv"`,
    },
  });
}
