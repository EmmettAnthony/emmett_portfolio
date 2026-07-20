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

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const technologies = await prisma.technology.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ technologies });
  } catch (error) {
    console.error("Failed to fetch technologies:", error);
    return NextResponse.json(
      { error: "Failed to fetch technologies" },
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
    const parsed = technologySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug || slugify(data.name);

    const existing = await prisma.technology.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A technology with this slug already exists" },
        { status: 409 }
      );
    }

    const technology = await prisma.technology.create({
      data: {
        name: data.name,
        slug,
        icon: data.icon ?? null,
        color: data.color ?? null,
        category: data.category ?? null,
      },
    });

    return NextResponse.json({ technology }, { status: 201 });
  } catch (error) {
    console.error("Failed to create technology:", error);
    return NextResponse.json(
      { error: "Failed to create technology" },
      { status: 500 }
    );
  }
}
