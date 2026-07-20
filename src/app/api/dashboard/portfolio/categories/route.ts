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

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.portfolioCategory.findMany({
      include: {
        _count: { select: { projects: true } },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = portfolioCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug || slugify(data.name);

    const existing = await prisma.portfolioCategory.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.portfolioCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        icon: data.icon ?? null,
        order: data.order ?? 0,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
