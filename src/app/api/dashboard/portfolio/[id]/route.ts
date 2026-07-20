import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { portfolioProjectSchema } from "@/lib/validations/portfolio";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const project = await prisma.portfolioProject.findUnique({
      where: { id },
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

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { technologies: true, metrics: true, caseStudy: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = portfolioProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
      let slug = slugify(data.title);
      const slugExists = await prisma.portfolioProject.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
      updateData.slug = slug;
    }
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription;
    if (data.projectSummary !== undefined) updateData.projectSummary = data.projectSummary;
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.clientIndustry !== undefined) updateData.clientIndustry = data.clientIndustry;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.thumbnailImage !== undefined) updateData.thumbnailImage = data.thumbnailImage;
    if (data.galleryImages !== undefined) updateData.galleryImages = JSON.parse(JSON.stringify(data.galleryImages)) as never;
    if (data.videoDemo !== undefined) updateData.videoDemo = data.videoDemo;
    if (data.projectLogo !== undefined) updateData.projectLogo = data.projectLogo;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.completionDate !== undefined) updateData.completionDate = data.completionDate ? new Date(data.completionDate) : null;
    if (data.projectDuration !== undefined) updateData.projectDuration = data.projectDuration;
    if (data.teamSize !== undefined) updateData.teamSize = data.teamSize;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.published !== undefined) updateData.published = data.published;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.liveUrl !== undefined) updateData.liveUrl = data.liveUrl;
    if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl;
    if (data.demoUrl !== undefined) updateData.demoUrl = data.demoUrl;
    if (data.caseStudyUrl !== undefined) updateData.caseStudyUrl = data.caseStudyUrl;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.ogImage !== undefined) updateData.ogImage = data.ogImage;
    if (data.canonicalUrl !== undefined) updateData.canonicalUrl = data.canonicalUrl;
    if (data.tags !== undefined) updateData.tags = JSON.parse(JSON.stringify(data.tags)) as never;
    if (data.awards !== undefined) updateData.awards = JSON.parse(JSON.stringify(data.awards)) as never;
    if (data.testimonialIds !== undefined) updateData.testimonialIds = JSON.parse(JSON.stringify(data.testimonialIds)) as never;

    if (data.technologyIds !== undefined) {
      updateData.technologies = {
        set: data.technologyIds.map((tid: string) => ({ id: tid })),
      };
    }

    if (data.metrics !== undefined) {
      await prisma.projectMetric.deleteMany({ where: { projectId: id } });
    }

    await prisma.portfolioProject.update({
      where: { id },
      data: updateData,
    });

    if (data.metrics && data.metrics.length > 0) {
      await prisma.projectMetric.createMany({
        data: data.metrics.map((m) => ({
          projectId: id,
          label: m.label,
          value: m.value,
          prefix: m.prefix ?? null,
          suffix: m.suffix ?? null,
          order: m.order ?? 0,
        })),
      });
    }

    const caseStudyData = body.caseStudy as Record<string, unknown> | undefined;
    if (caseStudyData !== undefined) {
      const existingCaseStudy = existing.caseStudy;
      if (existingCaseStudy) {
        const csUpdate: Record<string, unknown> = {};
        if (caseStudyData.clientBackground !== undefined) csUpdate.clientBackground = caseStudyData.clientBackground;
        if (caseStudyData.businessProblem !== undefined) csUpdate.businessProblem = caseStudyData.businessProblem;
        if (caseStudyData.objectives !== undefined) csUpdate.objectives = caseStudyData.objectives;
        if (caseStudyData.research !== undefined) csUpdate.research = caseStudyData.research;
        if (caseStudyData.solution !== undefined) csUpdate.solution = caseStudyData.solution;
        if (caseStudyData.developmentProcess !== undefined) csUpdate.developmentProcess = caseStudyData.developmentProcess;
        if (caseStudyData.results !== undefined) csUpdate.results = caseStudyData.results;
        if (caseStudyData.lessonsLearned !== undefined) csUpdate.lessonsLearned = caseStudyData.lessonsLearned;
        if (caseStudyData.challenges !== undefined) csUpdate.challenges = caseStudyData.challenges;
        if (caseStudyData.requirements !== undefined) csUpdate.requirements = caseStudyData.requirements;
        if (caseStudyData.projectGoals !== undefined) csUpdate.projectGoals = caseStudyData.projectGoals;
        if (caseStudyData.problemStatement !== undefined) csUpdate.problemStatement = caseStudyData.problemStatement;
        if (Object.keys(csUpdate).length > 0) {
          await prisma.caseStudy.update({
            where: { projectId: id },
            data: csUpdate,
          });
        }
      } else if (Object.keys(caseStudyData).length > 0) {
        await prisma.caseStudy.create({
          data: {
            projectId: id,
            clientBackground: (caseStudyData.clientBackground as string) ?? null,
            businessProblem: (caseStudyData.businessProblem as string) ?? null,
            objectives: (caseStudyData.objectives as string) ?? null,
            research: (caseStudyData.research as string) ?? null,
            solution: (caseStudyData.solution as string) ?? null,
            developmentProcess: (caseStudyData.developmentProcess as string) ?? null,
            results: (caseStudyData.results as string) ?? null,
            lessonsLearned: (caseStudyData.lessonsLearned as string) ?? null,
            challenges: (caseStudyData.challenges as string) ?? null,
            requirements: (caseStudyData.requirements as string) ?? null,
            projectGoals: (caseStudyData.projectGoals as string) ?? null,
            problemStatement: (caseStudyData.problemStatement as string) ?? null,
          },
        });
      }
    }

    const project = await prisma.portfolioProject.findUnique({
      where: { id },
      include: {
        category: true,
        technologies: true,
        caseStudy: true,
        metrics: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.portfolioProject.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await prisma.portfolioProject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
