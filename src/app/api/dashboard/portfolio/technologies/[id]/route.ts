import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { technologySchema } from "@/lib/validations/portfolio";

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
    const existing = await prisma.technology.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Technology not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = technologySchema.safeParse(body);

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
      const slugExists = await prisma.technology.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
      updateData.slug = slug;
    } else if (data.slug !== undefined) {
      updateData.slug = data.slug;
    }

    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.category !== undefined) updateData.category = data.category;

    const technology = await prisma.technology.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ technology });
  } catch (error) {
    console.error("Failed to update technology:", error);
    return NextResponse.json(
      { error: "Failed to update technology" },
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
    const existing = await prisma.technology.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Technology not found" },
        { status: 404 }
      );
    }

    await prisma.technology.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete technology:", error);
    return NextResponse.json(
      { error: "Failed to delete technology" },
      { status: 500 }
    );
  }
}
