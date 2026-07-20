import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotification } from "@/lib/notifications/notification-service";
import { runAutomationRules } from "@/lib/support/automation-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const urgentPriority = await prisma.supportPriority.findFirst({ where: { slug: "urgent" } });
    const openStatus = await prisma.supportStatus.findFirst({ where: { isDefault: true } });

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `CHAT-${Date.now().toString(36).toUpperCase()}`,
        subject: body.subject || "Chat Escalation",
        description: body.message || "Visitor requested human support",
        fullName: body.fullName || "Chat Visitor",
        email: body.email || "visitor@chatbot",
        source: "chatbot",
        priorityId: urgentPriority?.id,
        statusId: openStatus?.id || (await prisma.supportStatus.findFirst({ orderBy: { order: "asc" } }))!.id,
      },
    });

    runAutomationRules("ticket_escalated", ticket).catch(() => {});

    await sendNotification({
      eventKey: "support.ticket.escalated",
      title: `🚨 Chat Escalated: ${ticket.ticketNumber}`,
      message: `${body.fullName || "A visitor"} needs human support`,
      link: `/dashboard/support/tickets/${ticket.id}`,
      source: "support",
      categoryOverride: "SUPPORT" as const,
      priorityOverride: "HIGH" as const,
    });

    return NextResponse.json({ success: true, ticketNumber: ticket.ticketNumber, ticketId: ticket.id });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to escalate" }, { status: 400 });
  }
}
