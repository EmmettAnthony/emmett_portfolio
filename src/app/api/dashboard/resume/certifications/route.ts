import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { certificationSchema } from "@/lib/validations/resume";
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

    const certifications = await prisma.certification.findMany({
      where: { resumeId: resume.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ certifications });
  } catch (error) {
    console.error("Failed to fetch certifications:", error);
    return NextResponse.json({ error: "Failed to fetch certifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const validated = certificationSchema.parse(body);

    const certification = await prisma.certification.create({
      data: {
        resumeId: resume.id,
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

    await logResumeActivity("create", "resume_certification", `Added ${validated.name}`, certification.id);

    return NextResponse.json({ certification }, { status: 201 });
  } catch (error) {
    console.error("Failed to create certification:", error);
    return NextResponse.json({ error: "Failed to create certification" }, { status: 500 });
  }
}
