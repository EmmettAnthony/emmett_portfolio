import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        published: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { title, slug, content, excerpt, category, tags, image, metaTitle, metaDescription, published } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const prisma = getPrisma();

    // Check slug uniqueness
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }

    // Calculate reading time
    const wordCount = content ? content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content: content || "",
        category: category || null,
        tags: tags ? JSON.stringify(tags) : null,
        image: image || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        published,
        publishedAt: published ? new Date() : null,
        readingTime,
      },
    });

    return NextResponse.json({ id: post.id, slug: post.slug }, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
