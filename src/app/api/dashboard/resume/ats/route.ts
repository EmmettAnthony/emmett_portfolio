import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { calculateATSScore } from "@/lib/resume-ats";

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
        languages: { orderBy: { order: "asc" } },
      },
    });

    if (!resume) return NextResponse.json({ error: "No resume found" }, { status: 404 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
    const result = calculateATSScore(resume as any);
    return NextResponse.json(result);
  } catch (error) {
    console.error("ATS check failed:", error);
    return NextResponse.json({ error: "ATS check failed" }, { status: 500 });
  }
}
