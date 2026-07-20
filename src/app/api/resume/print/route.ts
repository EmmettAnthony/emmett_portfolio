import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get("template") || "modern";

    const resume = await prisma.resumeProfile.findFirst({
      where: { published: true },
      include: {
        experiences: { orderBy: { order: "asc" } },
        education: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
        awards: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
        references: {
          where: { isPublic: true },
          orderBy: { order: "asc" },
        },
        featuredProjects: {
          orderBy: { order: "asc" },
          include: {
            project: {
              include: {
                technologies: true,
              },
            },
          },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "No published resume found" }, { status: 404 });
    }

    return NextResponse.json({ resume, template }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 });
  }
}
