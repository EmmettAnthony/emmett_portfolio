import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await prisma.portfolioProject.findMany({
      include: {
        category: { select: { name: true, slug: true } },
        technologies: { select: { name: true, slug: true, category: true } },
        caseStudy: true,
        metrics: { orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    const exportData = projects.map((p) => ({
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription,
      fullDescription: p.fullDescription,
      projectSummary: p.projectSummary,
      clientName: p.clientName,
      clientIndustry: p.clientIndustry,
      category: p.category?.name ?? null,
      technologies: p.technologies.map((t) => t.name),
      featuredImage: p.featuredImage,
      thumbnailImage: p.thumbnailImage,
      galleryImages: p.galleryImages,
      videoDemo: p.videoDemo,
      projectLogo: p.projectLogo,
      startDate: p.startDate?.toISOString() ?? null,
      completionDate: p.completionDate?.toISOString() ?? null,
      projectDuration: p.projectDuration,
      teamSize: p.teamSize,
      status: p.status,
      featured: p.featured,
      published: p.published,
      order: p.order,
      viewCount: p.viewCount,
      liveUrl: p.liveUrl,
      githubUrl: p.githubUrl,
      demoUrl: p.demoUrl,
      caseStudyUrl: p.caseStudyUrl,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      ogImage: p.ogImage,
      canonicalUrl: p.canonicalUrl,
      tags: p.tags,
      awards: p.awards,
      testimonialIds: p.testimonialIds,
      metrics: p.metrics.map((m) => ({
        label: m.label,
        value: m.value,
        prefix: m.prefix,
        suffix: m.suffix,
        order: m.order,
      })),
      caseStudy: p.caseStudy
        ? {
            clientBackground: p.caseStudy.clientBackground,
            businessProblem: p.caseStudy.businessProblem,
            objectives: p.caseStudy.objectives,
            research: p.caseStudy.research,
            solution: p.caseStudy.solution,
            developmentProcess: p.caseStudy.developmentProcess,
            results: p.caseStudy.results,
            lessonsLearned: p.caseStudy.lessonsLearned,
            challenges: p.caseStudy.challenges,
            requirements: p.caseStudy.requirements,
            projectGoals: p.caseStudy.projectGoals,
            problemStatement: p.caseStudy.problemStatement,
          }
        : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json({ count: exportData.length, projects: exportData });
  } catch (error) {
    console.error("Failed to export projects:", error);
    return NextResponse.json(
      { error: "Failed to export projects" },
      { status: 500 }
    );
  }
}
