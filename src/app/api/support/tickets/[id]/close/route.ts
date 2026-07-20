import { NextResponse } from "next/server";
import { closeTicketAction } from "@/actions/support/tickets";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await closeTicketAction(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("POST /api/support/tickets/[id]/close error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to close ticket" }, { status: 400 });
  }
}
