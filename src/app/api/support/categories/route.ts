import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.supportCategory.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { tickets: true } },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/support/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const created = await prisma.supportCategory.create({ data });
    return NextResponse.json(created);
  } catch (error: unknown) {
    console.error("POST /api/support/categories error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create" }, { status: 400 });
  }
}
