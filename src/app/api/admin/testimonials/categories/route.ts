import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const prisma = getPrisma();
    const categories = await prisma.testimonialCategory.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { name, description } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const prisma = getPrisma();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const category = await prisma.testimonialCategory.create({ data: { name, slug, description } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { ids, action } = body;
    if (!ids?.length || !action) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const prisma = getPrisma();
    if (action === "delete") {
      await prisma.testimonialCategory.deleteMany({ where: { id: { in: ids } } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed bulk action:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
