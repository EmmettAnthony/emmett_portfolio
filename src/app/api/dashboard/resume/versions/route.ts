import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { logResumeActivity } from "@/lib/resume-activity";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await prisma.resumeProfile.findFirst({ orderBy: { createdAt: "desc" } });
    if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 404 });

    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: resume.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Failed to fetch versions:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const label = body.label || "";

    const resume = await prisma.resumeProfile.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        experiences: { orderBy: { order: "asc" } },
        education: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
        awards: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
        references: { orderBy: { order: "asc" } },
      },
    });

    if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 404 });

    const snapshot = {
      profile: {
        fullName: resume.fullName,
        professionalTitle: resume.professionalTitle,
        photo: resume.photo,
        location: resume.location,
        yearsOfExperience: resume.yearsOfExperience,
        summary: resume.summary,
        summaryTitle: resume.summaryTitle,
        specializations: resume.specializations,
        socialLinks: resume.socialLinks,
        email: resume.email,
        phone: resume.phone,
        website: resume.website,
        template: resume.template,
        visibility: resume.visibility,
      },
      experiences: resume.experiences,
      education: resume.education,
      skills: resume.skills,
      certifications: resume.certifications,
      awards: resume.awards,
      languages: resume.languages,
      references: resume.references,
    };

    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: resume.id,
        label,
        data: JSON.parse(JSON.stringify(snapshot)),
      },
    });

    await logResumeActivity("create", "resume_version", `Saved version: ${label}`, version.id);

    return NextResponse.json({ version });
  } catch (error) {
    console.error("Failed to create version:", error);
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 });
  }
}
