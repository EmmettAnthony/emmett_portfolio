import { NextResponse } from "next/server";
import { getTicketStatsAction } from "@/actions/support/tickets";

export async function GET() {
  try {
    const stats = await getTicketStatsAction();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/support/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
