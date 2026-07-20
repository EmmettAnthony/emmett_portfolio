import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { logResumeActivity } from "@/lib/resume-activity";

async function getResume() {
  return prisma.resumeProfile.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const featuredProjects = await prisma.resumeFeaturedProject.findMany({
      where: { resumeId: resume.id },
      orderBy: { order: "asc" },
      include: { project: true },
    });

    return NextResponse.json({ featuredProjects });
  } catch (error) {
    console.error("Failed to fetch featured projects:", error);
    return NextResponse.json({ error: "Failed to fetch featured projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.portfolioProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get the next order value
    const last = await prisma.resumeFeaturedProject.findFirst({
      where: { resumeId: resume.id },
      orderBy: { order: "desc" },
    });

    const featuredProject = await prisma.resumeFeaturedProject.create({
      data: {
        resumeId: resume.id,
        projectId,
        order: (last?.order ?? -1) + 1,
      },
      include: { project: true },
    });

    await logResumeActivity("create", "resume_featured_project", "Added project to featured", featuredProject.id);

    return NextResponse.json({ featuredProject }, { status: 201 });
  } catch (error) {
    console.error("Failed to create featured project:", error);
    return NextResponse.json({ error: "Failed to create featured project" }, { status: 500 });
  }
}
