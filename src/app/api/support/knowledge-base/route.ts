import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const published = searchParams.get("published") !== "false";

    const where: Prisma.SupportKnowledgeArticleFindManyArgs["where"] = { published };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const articles = await prisma.supportKnowledgeArticle.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET /api/support/knowledge-base error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const created = await prisma.supportKnowledgeArticle.create({ data });
    return NextResponse.json(created);
  } catch (error: unknown) {
    console.error("POST /api/support/knowledge-base error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create" }, { status: 400 });
  }
}
