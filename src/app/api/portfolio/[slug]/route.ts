import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get("preview") === "true";

    const where: Record<string, unknown> = { slug };
    if (!preview) {
      where.published = true;
    } else {
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const project = await prisma.portfolioProject.findFirst({
      where: where as never,
      include: {
        category: true,
        technologies: true,
        caseStudy: true,
        metrics: { orderBy: { order: "asc" } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.$transaction([
      prisma.portfolioProject.update({
        where: { id: project.id },
        data: { viewCount: { increment: 1 } },
      }),
      prisma.projectDailyView.upsert({
        where: { projectId_date: { projectId: project.id, date: today } },
        update: { count: { increment: 1 } },
        create: { projectId: project.id, date: today, count: 1 },
      }),
    ]);

    const relatedProjects = project.categoryId
      ? await prisma.portfolioProject.findMany({
          where: {
            categoryId: project.categoryId,
            id: { not: project.id },
            published: true,
          },
          include: {
            category: true,
            technologies: true,
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        })
      : [];

    const testimonialIds = project.testimonialIds as string[] | null;
    let testimonials: Record<string, unknown>[] = [];
    if (testimonialIds && Array.isArray(testimonialIds) && testimonialIds.length > 0) {
      testimonials = await prisma.testimonial.findMany({
        where: { id: { in: testimonialIds } },
      });
    }

    return NextResponse.json({
      project: {
        ...project,
        viewCount: project.viewCount + 1,
      },
      relatedProjects,
      testimonials,
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
