import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { knowledgeBaseSchema, knowledgeBaseUpdateSchema } from "@/lib/validations/chatbot";
import { auth } from "@/../auth";
import { generateEmbedding } from "@/lib/ai/embeddings";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const enabled = searchParams.get("enabled");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (enabled !== null) where.enabled = enabled === "true";
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
      prisma.knowledgeBase.count({ where }),
    ]);

    return NextResponse.json({ entries, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Failed to fetch knowledge base:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = knowledgeBaseSchema.parse(body);

    const entry = await prisma.knowledgeBase.create({
      data: {
        title: parsed.title,
        content: parsed.content,
        categoryId: parsed.categoryId ?? null,
        tags: parsed.tags,
        source: parsed.source ?? null,
        sourceUrl: parsed.sourceUrl ?? null,
        enabled: parsed.enabled,
      },
      include: { category: true },
    });

    generateEmbedding(`${parsed.title}\n\n${parsed.content}`).then((embedding) => {
      if (embedding) {
        prisma.$executeRawUnsafe(
          `UPDATE "knowledge_base" SET embedding = $1::vector WHERE id = $2`,
          `[${embedding.join(",")}]`,
          entry.id
        ).catch(() => {});
      }
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Failed to create knowledge base entry:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create knowledge base entry" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const body = await request.json();
    const parsed = knowledgeBaseUpdateSchema.parse(body);

    const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const entry = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined && { title: parsed.title }),
        ...(parsed.content !== undefined && { content: parsed.content }),
        ...(parsed.categoryId !== undefined && { categoryId: parsed.categoryId }),
        ...(parsed.tags !== undefined && { tags: parsed.tags }),
        ...(parsed.source !== undefined && { source: parsed.source }),
        ...(parsed.sourceUrl !== undefined && { sourceUrl: parsed.sourceUrl }),
        ...(parsed.enabled !== undefined && { enabled: parsed.enabled }),
      },
      include: { category: true },
    });

    const textChanged = parsed.title !== undefined || parsed.content !== undefined;
    if (textChanged) {
      generateEmbedding(`${entry.title}\n\n${entry.content}`).then((embedding) => {
        if (embedding) {
          prisma.$executeRawUnsafe(
            `UPDATE "knowledge_base" SET embedding = $1::vector WHERE id = $2`,
            `[${embedding.join(",")}]`,
            entry.id
          ).catch(() => {});
        }
      });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to update knowledge base entry:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update knowledge base entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    await prisma.knowledgeBase.delete({ where: { id } });

    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Failed to delete knowledge base entry:", error);
    return NextResponse.json({ error: "Failed to delete knowledge base entry" }, { status: 500 });
  }
}
