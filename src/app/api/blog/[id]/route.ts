import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, content, excerpt, category, tags, image, metaTitle, metaDescription, published } = body;

    const prisma = getPrisma();

    // Check slug uniqueness (exclude current post)
    if (slug) {
      const existing = await prisma.blogPost.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
      }
    }

    // Calculate reading time
    const wordCount = content ? content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content, readingTime }),
        ...(excerpt !== undefined && { excerpt }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
        ...(image !== undefined && { image }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(published !== undefined && { published, publishedAt: published ? new Date() : null }),
      },
    });

    // Fire blog_notification automation when published
    if (published === true && post.publishedAt) {
      try {
        const automations = await prisma.automation.findMany({
          where: { triggerType: "blog_notification", status: "ACTIVE" },
          include: { steps: { orderBy: { stepOrder: "asc" } } },
        });

        const blogSubscribers = await prisma.subscriber.findMany({
          where: {
            status: "ACTIVE",
            preferences: { receiveBlogUpdates: true },
          },
          include: { preferences: true },
        });

        for (const automation of automations) {
          for (const step of automation.steps) {
            const delayMs = step.delayDays * 86400000 + step.delayHours * 3600000;
            for (const subscriber of blogSubscribers) {
              const executeAt = new Date(Date.now() + delayMs);
              await prisma.automationStep.update({
                where: { id: step.id },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON data
                data: { condition: { ...(step.condition as Record<string, unknown> || {}), _scheduledFor: subscriber.id, _executeAt: executeAt.toISOString(), _postSlug: slug || post.slug } as any },
              });
            }
          }
        }
      } catch {}
    }

    // Auto-create revision on save
    if (content !== undefined || title !== undefined) {
      await prisma.blogRevision.create({
        data: {
          postId: id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          category: post.category,
          tags: post.tags,
          image: post.image,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
        },
      });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to update post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
