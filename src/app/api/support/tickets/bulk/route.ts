import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  const { ticketIds, action, value } = await request.json();
  if (!ticketIds?.length || !action) {
    return NextResponse.json({ error: "ticketIds and action are required" }, { status: 400 });
  }
  const results: { success: number; failed: number } = { success: 0, failed: 0 };
  for (const id of ticketIds) {
    try {
      switch (action) {
        case "assign":
          await prisma.supportTicket.update({ where: { id }, data: { assignedToId: value } });
          break;
        case "status":
          await prisma.supportTicket.update({ where: { id }, data: { statusId: value } });
          break;
        case "priority":
          await prisma.supportTicket.update({ where: { id }, data: { priorityId: value } });
          break;
        case "delete":
          await prisma.supportTicket.delete({ where: { id } });
          break;
        default:
          return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
      }
      results.success++;
    } catch {
      results.failed++;
    }
  }
  await logActivity({ module: "crm", entity: "SupportTicket", action: `bulk_${action}`, description: `Bulk ${action} on ${ticketIds.length} tickets`, metadata: { ticketIds, action, value } });
  return NextResponse.json(results);
}
