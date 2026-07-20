import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { referenceSchema } from "@/lib/validations/resume";
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

    const references = await prisma.reference.findMany({
      where: { resumeId: resume.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ references });
  } catch (error) {
    console.error("Failed to fetch references:", error);
    return NextResponse.json({ error: "Failed to fetch references" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const validated = referenceSchema.parse(body);

    const reference = await prisma.reference.create({
      data: {
        resumeId: resume.id,
        name: validated.name,
        position: validated.position ?? null,
        organization: validated.organization ?? null,
        email: validated.email ?? null,
        phone: validated.phone ?? null,
        isPublic: validated.isPublic,
        order: validated.order,
      },
    });

    await logResumeActivity("create", "resume_reference", `Added ${validated.name}`, reference.id);

    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    console.error("Failed to create reference:", error);
    return NextResponse.json({ error: "Failed to create reference" }, { status: 500 });
  }
}
