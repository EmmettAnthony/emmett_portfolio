import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { educationSchema } from "@/lib/validations/resume";
import { logResumeActivity } from "@/lib/resume-activity";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const education = await prisma.education.findUnique({ where: { id } });

    if (!education) {
      return NextResponse.json({ error: "Education not found" }, { status: 404 });
    }

    return NextResponse.json({ education });
  } catch (error) {
    console.error("Failed to fetch education:", error);
    return NextResponse.json({ error: "Failed to fetch education" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = educationSchema.parse(body);

    const education = await prisma.education.update({
      where: { id },
      data: {
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

    await logResumeActivity("update", "resume_education", `Updated ${validated.institution}`, id);

    return NextResponse.json({ education });
  } catch (error) {
    console.error("Failed to update education:", error);
    return NextResponse.json({ error: "Failed to update education" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const item = await prisma.education.findUnique({ where: { id } });
    await prisma.education.delete({ where: { id } });
    await logResumeActivity("delete", "resume_education", `Deleted ${item?.institution}`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete education:", error);
    return NextResponse.json({ error: "Failed to delete education" }, { status: 500 });
  }
}
