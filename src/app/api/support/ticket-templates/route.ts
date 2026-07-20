import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.supportTicketTemplate.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        defaultPriority: { select: { id: true, name: true, slug: true } },
        defaultCategory: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/support/ticket-templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const created = await prisma.supportTicketTemplate.create({ data });
    return NextResponse.json(created);
  } catch (error: unknown) {
    console.error("POST /api/support/ticket-templates error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create" }, { status: 400 });
  }
}
