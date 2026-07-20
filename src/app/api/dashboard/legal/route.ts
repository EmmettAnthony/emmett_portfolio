import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    const pages = await prisma.legalPage.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Failed to fetch legal pages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const prisma = getPrisma();
    const page = await prisma.legalPage.create({
      data: {
        slug: body.slug,
        title: body.title,
        content: body.content,
        lastUpdated: body.lastUpdated ? new Date(body.lastUpdated) : new Date(),
        published: body.published ?? true,
      },
    });
    return NextResponse.json({ page });
  } catch (error) {
    console.error("Failed to create legal page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
