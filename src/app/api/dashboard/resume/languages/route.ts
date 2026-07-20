import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { languageSchema } from "@/lib/validations/resume";
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

    const languages = await prisma.language.findMany({
      where: { resumeId: resume.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ languages });
  } catch (error) {
    console.error("Failed to fetch languages:", error);
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const validated = languageSchema.parse(body);

    const language = await prisma.language.create({
      data: {
        resumeId: resume.id,
        language: validated.language,
        proficiency: validated.proficiency,
        order: validated.order,
      },
    });

    await logResumeActivity("create", "resume_language", `Added ${validated.language}`, language.id);

    return NextResponse.json({ language }, { status: 201 });
  } catch (error) {
    console.error("Failed to create language:", error);
    return NextResponse.json({ error: "Failed to create language" }, { status: 500 });
  }
}
