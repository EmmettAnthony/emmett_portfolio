import { NextResponse, NextRequest } from "next/server";
import { assignTicketAction } from "@/actions/support/tickets";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await assignTicketAction(id, body.assigneeId || null);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to assign ticket" }, { status: 400 });
  }
}
