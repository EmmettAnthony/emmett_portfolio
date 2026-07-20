import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { caseStudySchema } from "@/lib/validations/portfolio";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const caseStudies = await prisma.caseStudy.findMany({
      include: {
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ caseStudies });
  } catch (error) {
    console.error("Failed to fetch case studies:", error);
    return NextResponse.json(
      { error: "Failed to fetch case studies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = caseStudySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }



    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const project = await prisma.portfolioProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const existingCaseStudy = await prisma.caseStudy.findUnique({
      where: { projectId },
    });

    if (existingCaseStudy) {
      return NextResponse.json(
        { error: "A case study already exists for this project" },
        { status: 409 }
      );
    }

    const data = parsed.data;

    const caseStudy = await prisma.caseStudy.create({
      data: {
        projectId,
        clientBackground: data.clientBackground ?? null,
        businessProblem: data.businessProblem ?? null,
        objectives: data.objectives ?? null,
        research: data.research ?? null,
        solution: data.solution ?? null,
        developmentProcess: data.developmentProcess ?? null,
        results: data.results ?? null,
        lessonsLearned: data.lessonsLearned ?? null,
        challenges: data.challenges ?? null,
        requirements: data.requirements ?? null,
        projectGoals: data.projectGoals ?? null,
        problemStatement: data.problemStatement ?? null,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
            featuredImage: true,
          },
        },
      },
    });

    return NextResponse.json({ caseStudy }, { status: 201 });
  } catch (error) {
    console.error("Failed to create case study:", error);
    return NextResponse.json(
      { error: "Failed to create case study" },
      { status: 500 }
    );
  }
}
