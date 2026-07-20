import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { knowledgeCategorySchema, knowledgeCategoryUpdateSchema } from "@/lib/validations/chatbot";
import { auth } from "@/../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await prisma.knowledgeCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = knowledgeCategorySchema.parse(body);

    const existing = await prisma.knowledgeCategory.findUnique({ where: { slug: parsed.slug } });
    if (existing) {
      return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
    }

    const category = await prisma.knowledgeCategory.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description ?? null,
        icon: parsed.icon ?? null,
        color: parsed.color ?? null,
        order: parsed.order,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
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
    const parsed = knowledgeCategoryUpdateSchema.parse(body);

    const existing = await prisma.knowledgeCategory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    if (parsed.slug && parsed.slug !== existing.slug) {
      const slugExists = await prisma.knowledgeCategory.findUnique({ where: { slug: parsed.slug } });
      if (slugExists) return NextResponse.json({ error: "A category with this slug already exists" }, { status: 409 });
    }

    const category = await prisma.knowledgeCategory.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.slug !== undefined && { slug: parsed.slug }),
        ...(parsed.description !== undefined && { description: parsed.description }),
        ...(parsed.icon !== undefined && { icon: parsed.icon }),
        ...(parsed.color !== undefined && { color: parsed.color }),
        ...(parsed.order !== undefined && { order: parsed.order }),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Failed to update category:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.knowledgeCategory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    await prisma.knowledgeCategory.delete({ where: { id } });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
