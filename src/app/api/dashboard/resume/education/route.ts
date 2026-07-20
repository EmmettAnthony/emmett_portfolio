import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { educationSchema } from "@/lib/validations/resume";
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

    const education = await prisma.education.findMany({
      where: { resumeId: resume.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ education });
  } catch (error) {
    console.error("Failed to fetch education:", error);
    return NextResponse.json({ error: "Failed to fetch education" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const validated = educationSchema.parse(body);

    const education = await prisma.education.create({
      data: {
        resumeId: resume.id,
        institution: validated.institution,
        degree: validated.degree ?? null,
        fieldOfStudy: validated.fieldOfStudy ?? null,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        grade: validated.grade ?? null,
        description: validated.description ?? null,
        order: validated.order,
      },
    });

    await logResumeActivity("create", "resume_education", `Added ${validated.institution}`, education.id);

    return NextResponse.json({ education }, { status: 201 });
  } catch (error) {
    console.error("Failed to create education:", error);
    return NextResponse.json({ error: "Failed to create education" }, { status: 500 });
  }
}
