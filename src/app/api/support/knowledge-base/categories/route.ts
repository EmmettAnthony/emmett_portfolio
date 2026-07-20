import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.supportKnowledgeCategory.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { articles: { where: { published: true } } } },
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/support/knowledge-base/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
