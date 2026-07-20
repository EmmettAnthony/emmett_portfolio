import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

async function getResume() {
  return prisma.resumeProfile.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      experiences: { orderBy: { order: "asc" } },
      education: { orderBy: { order: "asc" } },
      skills: { orderBy: { order: "asc" } },
      certifications: { orderBy: { order: "asc" } },
      awards: { orderBy: { order: "asc" } },
      languages: { orderBy: { order: "asc" } },
      references: { orderBy: { order: "asc" } },
      featuredProjects: {
        orderBy: { order: "asc" },
        include: { project: true },
      },
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resume = await getResume();
    if (!resume) return NextResponse.json({ error: "No resume profile found" }, { status: 404 });

    const body = await request.json();
    const template = body.template ?? "modern";

    // Record the download
    await prisma.resumeDownload.create({
      data: {
        resumeId: resume.id,
        template,
      },
    });

    // Return the full resume data for PDF generation
    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Failed to record download:", error);
    return NextResponse.json({ error: "Failed to record download" }, { status: 500 });
  }
}
