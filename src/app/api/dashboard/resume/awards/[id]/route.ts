import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { awardSchema } from "@/lib/validations/resume";
import { logResumeActivity } from "@/lib/resume-activity";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const award = await prisma.award.findUnique({ where: { id } });

    if (!award) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 });
    }

    return NextResponse.json({ award });
  } catch (error) {
    console.error("Failed to fetch award:", error);
    return NextResponse.json({ error: "Failed to fetch award" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = awardSchema.parse(body);

    const award = await prisma.award.update({
      where: { id },
      data: {
        title: validated.title,
        organization: validated.organization ?? null,
        date: validated.date ? new Date(validated.date) : null,
        description: validated.description ?? null,
        order: validated.order,
      },
    });

    await logResumeActivity("update", "resume_award", `Updated ${validated.title}`, id);

    return NextResponse.json({ award });
  } catch (error) {
    console.error("Failed to update award:", error);
    return NextResponse.json({ error: "Failed to update award" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const item = await prisma.award.findUnique({ where: { id } });
    await prisma.award.delete({ where: { id } });
    await logResumeActivity("delete", "resume_award", `Deleted ${item?.title}`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete award:", error);
    return NextResponse.json({ error: "Failed to delete award" }, { status: 500 });
  }
}
