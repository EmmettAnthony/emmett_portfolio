import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { experienceSchema } from "@/lib/validations/resume";
import { logResumeActivity } from "@/lib/resume-activity";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const experience = await prisma.experience.findUnique({ where: { id } });

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    return NextResponse.json({ experience });
  } catch (error) {
    console.error("Failed to fetch experience:", error);
    return NextResponse.json({ error: "Failed to fetch experience" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = experienceSchema.parse(body);

    const experience = await prisma.experience.update({
      where: { id },
      data: {
        jobTitle: validated.jobTitle,
        company: validated.company,
        employmentType: validated.employmentType,
        location: validated.location ?? null,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        current: validated.current,
        responsibilities: validated.responsibilities ?? [],
        achievements: validated.achievements ?? [],
        technologies: validated.technologies ?? [],
        order: validated.order,
      },
    });

    await logResumeActivity("update", "resume_experience", `Updated ${validated.jobTitle} at ${validated.company}`, id);

    return NextResponse.json({ experience });
  } catch (error) {
    console.error("Failed to update experience:", error);
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const item = await prisma.experience.findUnique({ where: { id } });
    await prisma.experience.delete({ where: { id } });
    await logResumeActivity("delete", "resume_experience", `Deleted ${item?.jobTitle}`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete experience:", error);
    return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 });
  }
}
