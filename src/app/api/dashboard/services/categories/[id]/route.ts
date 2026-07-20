import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { updateServiceCategorySchema } from "@/lib/validations/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { services: true } },
        services: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            published: true,
            featured: true,
            order: true,
            startingPrice: true,
            icon: true,
            shortDescription: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Failed to fetch service category:", error);
    return NextResponse.json(
      { error: "Failed to fetch service category" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateServiceCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.serviceCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.serviceCategory.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.order !== undefined) updateData.order = data.order;

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Failed to update service category:", error);
    return NextResponse.json(
      { error: "Failed to update service category" },
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
    const existing = await prisma.serviceCategory.findUnique({
      where: { id },
      include: { _count: { select: { services: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (existing._count.services > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing services. Remove or reassign services first." },
        { status: 409 }
      );
    }

    await prisma.serviceCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete service category:", error);
    return NextResponse.json(
      { error: "Failed to delete service category" },
      { status: 500 }
    );
  }
}
