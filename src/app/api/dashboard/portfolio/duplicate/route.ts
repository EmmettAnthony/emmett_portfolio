import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const original = await prisma.portfolioProject.findUnique({
      where: { id },
      include: {
        technologies: true,
        metrics: true,
      },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const newTitle = `${original.title} - Copy`;
    let newSlug = slugify(newTitle);

    const existing = await prisma.portfolioProject.findUnique({
      where: { slug: newSlug },
    });
    if (existing) {
      newSlug = `${newSlug}-${Date.now()}`;
    }

    const project = await prisma.portfolioProject.create({
      data: {
        title: newTitle,
        slug: newSlug,
        shortDescription: original.shortDescription,
        fullDescription: original.fullDescription,
        projectSummary: original.projectSummary,
        clientName: original.clientName,
        clientIndustry: original.clientIndustry,
        categoryId: original.categoryId,
        featuredImage: original.featuredImage,
        thumbnailImage: original.thumbnailImage,
        galleryImages: original.galleryImages as unknown as string[],
        videoDemo: original.videoDemo,
        projectLogo: original.projectLogo,
        startDate: original.startDate,
        completionDate: original.completionDate,
        projectDuration: original.projectDuration,
        teamSize: original.teamSize,
        status: "DRAFT",
        featured: false,
        published: false,
        order: original.order + 1,
        liveUrl: original.liveUrl,
        githubUrl: original.githubUrl,
        demoUrl: original.demoUrl,
        caseStudyUrl: original.caseStudyUrl,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        ogImage: original.ogImage,
        canonicalUrl: original.canonicalUrl,
        tags: original.tags as unknown as string[],
        awards: original.awards as unknown as string[],
        testimonialIds: original.testimonialIds as unknown as string[],
        technologies: {
          connect: original.technologies.map((t) => ({ id: t.id })),
        },
        metrics: original.metrics.length > 0
          ? {
              create: original.metrics.map((m) => ({
                label: m.label,
                value: m.value,
                prefix: m.prefix,
                suffix: m.suffix,
                order: m.order,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        technologies: true,
        metrics: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Failed to duplicate project:", error);
    return NextResponse.json(
      { error: "Failed to duplicate project" },
      { status: 500 }
    );
  }
}
