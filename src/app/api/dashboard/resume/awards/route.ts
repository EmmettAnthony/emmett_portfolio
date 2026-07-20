import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { awardSchema } from "@/lib/validations/resume";
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

    const awards = await prisma.award.findMany({
      where: { resumeId: resume.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ awards });
  } catch (error) {
    console.error("Failed to fetch awards:", error);
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const validated = awardSchema.parse(body);

    const award = await prisma.award.create({
      data: {
        resumeId: resume.id,
        title: validated.title,
        organization: validated.organization ?? null,
        date: validated.date ? new Date(validated.date) : null,
        description: validated.description ?? null,
        order: validated.order,
      },
    });

    await logResumeActivity("create", "resume_award", `Added ${validated.title}`, award.id);

    return NextResponse.json({ award }, { status: 201 });
  } catch (error) {
    console.error("Failed to create award:", error);
    return NextResponse.json({ error: "Failed to create award" }, { status: 500 });
  }
}
