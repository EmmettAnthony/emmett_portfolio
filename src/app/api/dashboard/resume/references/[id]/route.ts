import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { referenceSchema } from "@/lib/validations/resume";
import { logResumeActivity } from "@/lib/resume-activity";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const reference = await prisma.reference.findUnique({ where: { id } });

    if (!reference) {
      return NextResponse.json({ error: "Reference not found" }, { status: 404 });
    }

    return NextResponse.json({ reference });
  } catch (error) {
    console.error("Failed to fetch reference:", error);
    return NextResponse.json({ error: "Failed to fetch reference" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = referenceSchema.parse(body);

    const reference = await prisma.reference.update({
      where: { id },
      data: {
        name: validated.name,
        position: validated.position ?? null,
        organization: validated.organization ?? null,
        email: validated.email ?? null,
        phone: validated.phone ?? null,
        isPublic: validated.isPublic,
        order: validated.order,
      },
    });

    await logResumeActivity("update", "resume_reference", `Updated ${validated.name}`, id);

    return NextResponse.json({ reference });
  } catch (error) {
    console.error("Failed to update reference:", error);
    return NextResponse.json({ error: "Failed to update reference" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const item = await prisma.reference.findUnique({ where: { id } });
    await prisma.reference.delete({ where: { id } });
    await logResumeActivity("delete", "resume_reference", `Deleted ${item?.name}`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reference:", error);
    return NextResponse.json({ error: "Failed to delete reference" }, { status: 500 });
  }
}
