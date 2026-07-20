import { NextResponse, NextRequest } from "next/server";
import { replyToTicketAction } from "@/actions/support/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await replyToTicketAction(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/support/replies error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    if (errMsg.includes("Validation failed")) {
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
