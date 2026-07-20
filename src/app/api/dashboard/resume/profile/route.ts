import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { resumeProfileSchema } from "@/lib/validations/resume";
import { logResumeActivity } from "@/lib/resume-activity";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
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
        downloads: { orderBy: { downloadedAt: "desc" } },
        featuredProjects: {
          orderBy: { order: "asc" },
          include: { project: true },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "No resume profile found" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Failed to fetch resume profile:", error);
    return NextResponse.json({ error: "Failed to fetch resume profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = resumeProfileSchema.parse(body);

    const existing = await prisma.resumeProfile.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const resume = existing
      ? await prisma.resumeProfile.update({
          where: { id: existing.id },
          data: {
            ...validated,
            specializations: validated.specializations ?? [],
            socialLinks: validated.socialLinks ?? [],
          },
          include: {
            experiences: { orderBy: { order: "asc" } },
            education: { orderBy: { order: "asc" } },
            skills: { orderBy: { order: "asc" } },
            certifications: { orderBy: { order: "asc" } },
            awards: { orderBy: { order: "asc" } },
            languages: { orderBy: { order: "asc" } },
            references: { orderBy: { order: "asc" } },
            downloads: { orderBy: { downloadedAt: "desc" } },
            featuredProjects: {
              orderBy: { order: "asc" },
              include: { project: true },
            },
          },
        })
      : await prisma.resumeProfile.create({
          data: {
            ...validated,
            specializations: validated.specializations ?? [],
            socialLinks: validated.socialLinks ?? [],
          },
          include: {
            experiences: { orderBy: { order: "asc" } },
            education: { orderBy: { order: "asc" } },
            skills: { orderBy: { order: "asc" } },
            certifications: { orderBy: { order: "asc" } },
            awards: { orderBy: { order: "asc" } },
            languages: { orderBy: { order: "asc" } },
            references: { orderBy: { order: "asc" } },
            downloads: { orderBy: { downloadedAt: "desc" } },
            featuredProjects: {
              orderBy: { order: "asc" },
              include: { project: true },
            },
          },
        });

    await logResumeActivity("update", "resume_profile", "Updated resume profile");

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Failed to upsert resume profile:", error);
    return NextResponse.json({ error: "Failed to upsert resume profile" }, { status: 500 });
  }
}
