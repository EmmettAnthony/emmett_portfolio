import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { caseStudySchema } from "@/lib/validations/portfolio";

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
    const existing = await prisma.caseStudy.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Case study not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = caseStudySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.clientBackground !== undefined) updateData.clientBackground = data.clientBackground;
    if (data.businessProblem !== undefined) updateData.businessProblem = data.businessProblem;
    if (data.objectives !== undefined) updateData.objectives = data.objectives;
    if (data.research !== undefined) updateData.research = data.research;
    if (data.solution !== undefined) updateData.solution = data.solution;
    if (data.developmentProcess !== undefined) updateData.developmentProcess = data.developmentProcess;
    if (data.results !== undefined) updateData.results = data.results;
    if (data.lessonsLearned !== undefined) updateData.lessonsLearned = data.lessonsLearned;
    if (data.challenges !== undefined) updateData.challenges = data.challenges;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.projectGoals !== undefined) updateData.projectGoals = data.projectGoals;
    if (data.problemStatement !== undefined) updateData.problemStatement = data.problemStatement;

    const caseStudy = await prisma.caseStudy.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ caseStudy });
  } catch (error) {
    console.error("Failed to update case study:", error);
    return NextResponse.json(
      { error: "Failed to update case study" },
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
    const existing = await prisma.caseStudy.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Case study not found" },
        { status: 404 }
      );
    }

    await prisma.caseStudy.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete case study:", error);
    return NextResponse.json(
      { error: "Failed to delete case study" },
      { status: 500 }
    );
  }
}
