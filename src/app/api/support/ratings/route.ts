import { NextResponse, NextRequest } from "next/server";
import { rateTicketAction } from "@/actions/support/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await rateTicketAction(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/support/ratings error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 400 });
  }
}
