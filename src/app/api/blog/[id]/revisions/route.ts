import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const revisions = await prisma.blogRevision.findMany({
      where: { postId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    });

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error("Failed to fetch revisions:", error);
    return NextResponse.json({ error: "Failed to fetch revisions" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, excerpt, category, tags, image, metaTitle, metaDescription } = body;

    const prisma = getPrisma();

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const revision = await prisma.blogRevision.create({
      data: {
        postId: id,
        title: title || post.title,
        content: content || post.content,
        excerpt: excerpt || post.excerpt,
        category: category || post.category,
        tags: tags || post.tags,
        image: image || post.image,
        metaTitle: metaTitle || post.metaTitle,
        metaDescription: metaDescription || post.metaDescription,
      },
    });

    return NextResponse.json({ revision });
  } catch (error) {
    console.error("Failed to create revision:", error);
    return NextResponse.json({ error: "Failed to create revision" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { revisionId } = body;

    if (!revisionId) {
      return NextResponse.json({ error: "revisionId is required" }, { status: 400 });
    }

    const prisma = getPrisma();

    const revision = await prisma.blogRevision.findUnique({ where: { id: revisionId } });
    if (!revision || revision.postId !== id) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
        category: revision.category,
        tags: revision.tags,
        image: revision.image,
        metaTitle: revision.metaTitle,
        metaDescription: revision.metaDescription,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to restore revision:", error);
    return NextResponse.json({ error: "Failed to restore revision" }, { status: 500 });
  }
}
