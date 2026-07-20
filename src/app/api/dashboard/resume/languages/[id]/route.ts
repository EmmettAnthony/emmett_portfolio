import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { languageSchema } from "@/lib/validations/resume";
import { logResumeActivity } from "@/lib/resume-activity";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const language = await prisma.language.findUnique({ where: { id } });

    if (!language) {
      return NextResponse.json({ error: "Language not found" }, { status: 404 });
    }

    return NextResponse.json({ language });
  } catch (error) {
    console.error("Failed to fetch language:", error);
    return NextResponse.json({ error: "Failed to fetch language" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = languageSchema.parse(body);

    const language = await prisma.language.update({
      where: { id },
      data: {
        language: validated.language,
        proficiency: validated.proficiency,
        order: validated.order,
      },
    });

    await logResumeActivity("update", "resume_language", `Updated ${validated.language}`, id);

    return NextResponse.json({ language });
  } catch (error) {
    console.error("Failed to update language:", error);
    return NextResponse.json({ error: "Failed to update language" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const item = await prisma.language.findUnique({ where: { id } });
    await prisma.language.delete({ where: { id } });
    await logResumeActivity("delete", "resume_language", `Deleted ${item?.language}`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete language:", error);
    return NextResponse.json({ error: "Failed to delete language" }, { status: 500 });
  }
}
