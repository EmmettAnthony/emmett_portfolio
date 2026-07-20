import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 100);
    const category = searchParams.get("category");

    const prisma = getPrisma();
    const posts = await prisma.blogPost.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        image: true,
        category: true,
        tags: true,
        author: true,
        publishedAt: true,
        readingTime: true,
      },
    });

    const parsed = posts.map((p) => ({
      ...p,
      tags: p.tags ? (JSON.parse(p.tags) as string[]) : [],
    }));

    return NextResponse.json({ posts: parsed });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json({ posts: [] });
  }
}
