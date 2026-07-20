import { NextResponse, NextRequest } from "next/server";
import { getAuditTrails } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId") || undefined;
    const action = searchParams.get("action") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const trails = await getAuditTrails("SupportTicket", entityId, action, page, limit);
    return NextResponse.json(trails);
  } catch (error) {
    console.error("GET /api/support/audit-trail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
