import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const fields = await prisma.customField.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(fields);
  } catch (error) {
    console.error("Failed to fetch custom fields:", error);
    return NextResponse.json({ error: "Failed to fetch custom fields" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, slug, fieldType, required, options, placeholder, defaultValue, order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    const existing = await prisma.customField.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A field with this slug already exists" }, { status: 409 });
    }

    const field = await prisma.customField.create({
      data: {
        name,
        slug,
        fieldType: fieldType || "text",
        required: required ?? false,
        options: options || null,
        placeholder: placeholder || null,
        defaultValue: defaultValue || null,
        order: order ?? 0,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("Failed to create custom field:", error);
    return NextResponse.json({ error: "Failed to create custom field" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.customField.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete custom field:", error);
    return NextResponse.json({ error: "Failed to delete custom field" }, { status: 500 });
  }
}
