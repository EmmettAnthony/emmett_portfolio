import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { certificationSchema } from "@/lib/validations/resume";
import { logResumeActivity } from "@/lib/resume-activity";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const certification = await prisma.certification.findUnique({ where: { id } });

    if (!certification) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    return NextResponse.json({ certification });
  } catch (error) {
    console.error("Failed to fetch certification:", error);
    return NextResponse.json({ error: "Failed to fetch certification" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = certificationSchema.parse(body);

    const certification = await prisma.certification.update({
      where: { id },
      data: {
        name: validated.name,
        organization: validated.organization,
        issueDate: new Date(validated.issueDate),
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        credentialId: validated.credentialId ?? null,
        credentialUrl: validated.credentialUrl ?? null,
        certificateFile: validated.certificateFile ?? null,
        order: validated.order,
      },
    });

    await logResumeActivity("update", "resume_certification", `Updated ${validated.name}`, id);

    return NextResponse.json({ certification });
  } catch (error) {
    console.error("Failed to update certification:", error);
    return NextResponse.json({ error: "Failed to update certification" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const item = await prisma.certification.findUnique({ where: { id } });
    await prisma.certification.delete({ where: { id } });
    await logResumeActivity("delete", "resume_certification", `Deleted ${item?.name}`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete certification:", error);
    return NextResponse.json({ error: "Failed to delete certification" }, { status: 500 });
  }
}
