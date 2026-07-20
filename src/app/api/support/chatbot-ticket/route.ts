import { NextResponse, NextRequest } from "next/server";
import { createTicketAction } from "@/actions/support/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createTicketAction({
      fullName: body.fullName || "Chatbot Visitor",
      email: body.email || "visitor@chatbot",
      subject: body.subject || "Support Request from Chat",
      description: body.message || "No details provided",
      preferredContact: "email",
    });
    return NextResponse.json({ success: true, ticketNumber: result.ticket.ticketNumber });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create ticket" }, { status: 400 });
  }
}
