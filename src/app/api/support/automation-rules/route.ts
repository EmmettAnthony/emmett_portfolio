import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const rules = await prisma.supportAutomationRule.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("GET /api/support/automation-rules error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const created = await prisma.supportAutomationRule.create({ data });
    return NextResponse.json(created);
  } catch (error: unknown) {
    console.error("POST /api/support/automation-rules error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create" }, { status: 400 });
  }
}
