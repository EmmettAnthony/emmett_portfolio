import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { skillSchema } from "@/lib/validations/resume";
import { logResumeActivity } from "@/lib/resume-activity";

async function getResume() {
  return prisma.resumeProfile.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { resumeId: resume.id };
    if (category) where.category = category;

    const skills = await prisma.skill.findMany({
      where: where as never,
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ skills });
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const validated = skillSchema.parse(body);

    const skill = await prisma.skill.create({
      data: {
        resumeId: resume.id,
        name: validated.name,
        category: validated.category,
        proficiency: validated.proficiency,
        yearsOfExperience: validated.yearsOfExperience ?? null,
        order: validated.order,
      },
    });

    await logResumeActivity("create", "resume_skill", `Added ${validated.name}`, skill.id);

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    console.error("Failed to create skill:", error);
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}
