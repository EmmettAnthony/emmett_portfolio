import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { portfolioCategorySchema } from "@/lib/validations/portfolio";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.portfolioCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = portfolioCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
      let slug = data.slug || slugify(data.name);
      const slugExists = await prisma.portfolioCategory.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
      updateData.slug = slug;
    } else if (data.slug !== undefined) {
      updateData.slug = data.slug;
    }

    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.order !== undefined) updateData.order = data.order;

    const category = await prisma.portfolioCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.portfolioCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    await prisma.portfolioProject.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.portfolioCategory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
