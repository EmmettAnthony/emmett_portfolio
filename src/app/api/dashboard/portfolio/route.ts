import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { withActivityLog } from "@/lib/activity-wrappers";
import { portfolioProjectSchema } from "@/lib/validations/portfolio";
import { notifyProjectPublished } from "@/lib/notifications/event-handlers";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const technologyId = searchParams.get("technologyId");
    const featured = searchParams.get("featured");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

    const where: Record<string, unknown> = {};

    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (featured === "true") where.featured = true;
    else if (featured === "false") where.featured = false;

    if (technologyId) {
      where.technologies = {
        some: { id: technologyId },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [projects, total] = await Promise.all([
      prisma.portfolioProject.findMany({
        where: where as never,
        include: {
          category: true,
          technologies: true,
        },
        orderBy: { order: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.portfolioProject.count({ where: where as never }),
    ]);

    return NextResponse.json({ projects, total, page, pageSize });
  } catch (error) {
    console.error("Failed to fetch portfolio projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio projects" },
      { status: 500 }
    );
  }
}

// ─── POST /api/dashboard/portfolio ───────────────────────────────────────
const postProjectHandler = async (_request: NextRequest, _context: { userId: string }) => {
  try {
    const body = await _request.json();
    const parsed = portfolioProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let slug = data.slug || slugify(data.title);

    const existing = await prisma.portfolioProject.findUnique({
      where: { slug },
    });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const startDate = data.startDate ? new Date(data.startDate) : null;
    const completionDate = data.completionDate ? new Date(data.completionDate) : null;

    const project = await prisma.portfolioProject.create({
      data: {
        title: data.title,
        slug,
        shortDescription: data.shortDescription ?? null,
        fullDescription: data.fullDescription ?? null,
        projectSummary: data.projectSummary ?? null,
        clientName: data.clientName ?? null,
        clientIndustry: data.clientIndustry ?? null,
        categoryId: data.categoryId ?? null,
        featuredImage: data.featuredImage ?? null,
        thumbnailImage: data.thumbnailImage ?? null,
        galleryImages: data.galleryImages ? JSON.parse(JSON.stringify(data.galleryImages)) as never : "[]",
        videoDemo: data.videoDemo ?? null,
        projectLogo: data.projectLogo ?? null,
        startDate,
        completionDate,
        projectDuration: data.projectDuration ?? null,
        teamSize: data.teamSize ?? null,
        status: data.status ?? "DRAFT",
        featured: data.featured ?? false,
        published: data.published ?? false,
        order: data.order ?? 0,
        liveUrl: data.liveUrl ?? null,
        githubUrl: data.githubUrl ?? null,
        demoUrl: data.demoUrl ?? null,
        caseStudyUrl: data.caseStudyUrl ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        ogImage: data.ogImage ?? null,
        canonicalUrl: data.canonicalUrl ?? null,
        tags: data.tags ? JSON.parse(JSON.stringify(data.tags)) as never : "[]",
        awards: data.awards ? JSON.parse(JSON.stringify(data.awards)) as never : "[]",
        testimonialIds: data.testimonialIds ? JSON.parse(JSON.stringify(data.testimonialIds)) as never : "[]",
        technologies: data.technologyIds && data.technologyIds.length > 0
          ? { connect: data.technologyIds.map((id: string) => ({ id })) }
          : undefined,
        metrics: data.metrics && data.metrics.length > 0
          ? {
              create: data.metrics.map((m) => ({
                label: m.label,
                value: m.value,
                prefix: m.prefix ?? null,
                suffix: m.suffix ?? null,
                order: m.order ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        technologies: true,
        caseStudy: true,
        metrics: { orderBy: { order: "asc" } },
      },
    });

    // Fire notification when project is published
    if (data.published) {
      notifyProjectPublished(
        data.title,
        `/dashboard/portfolio/${project.id}`
      ).catch(() => {});
    }

    const caseStudyData = body.caseStudy as Record<string, unknown> | undefined;
    if (caseStudyData && Object.keys(caseStudyData).length > 0) {
      await prisma.caseStudy.create({
        data: {
          projectId: project.id,
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

    const fullProject = await prisma.portfolioProject.findUnique({
      where: { id: project.id },
      include: {
        category: true,
        technologies: true,
        caseStudy: true,
        metrics: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ project: fullProject }, { status: 201 });
  } catch (error) {
    console.error("Failed to create portfolio project:", error);
    return NextResponse.json(
      { error: "Failed to create portfolio project" },
      { status: 500 }
    );
  }
};

export const POST = withActivityLog(
  "create",
  "portfolio",
  "Created portfolio project",
)(postProjectHandler);
