import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    const page = await prisma.legalPage.findUnique({ where: { slug } });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ page });
  } catch (error) {
    console.error("Failed to fetch legal page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const prisma = getPrisma();
    const page = await prisma.legalPage.update({
      where: { slug },
      data: {
        title: body.title,
        content: body.content,
        lastUpdated: body.lastUpdated ? new Date(body.lastUpdated) : undefined,
        published: body.published ?? undefined,
        slug: body.slug ?? undefined,
      },
    });
    return NextResponse.json({ page });
  } catch (error) {
    console.error("Failed to update legal page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    await prisma.legalPage.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete legal page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
