import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  try {
    const prisma = getPrisma();
    if (slug) {
      const page = await prisma.legalPage.findUnique({ where: { slug, published: true } });
      if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ page });
    }
    const pages = await prisma.legalPage.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Failed to fetch legal pages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
