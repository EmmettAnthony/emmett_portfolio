import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { experienceSchema } from "@/lib/validations/resume";
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

    const experiences = await prisma.experience.findMany({
      where: { resumeId: resume.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ experiences });
  } catch (error) {
    console.error("Failed to fetch experiences:", error);
    return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const validated = experienceSchema.parse(body);

    const experience = await prisma.experience.create({
      data: {
        resumeId: resume.id,
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

    await logResumeActivity("create", "resume_experience", `Added ${validated.jobTitle} at ${validated.company}`, experience.id);

    return NextResponse.json({ experience }, { status: 201 });
  } catch (error) {
    console.error("Failed to create experience:", error);
    return NextResponse.json({ error: "Failed to create experience" }, { status: 500 });
  }
}
