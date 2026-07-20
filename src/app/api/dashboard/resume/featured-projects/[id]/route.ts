import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { logResumeActivity } from "@/lib/resume-activity";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    await prisma.resumeFeaturedProject.delete({ where: { id } });
    await logResumeActivity("delete", "resume_featured_project", `Removed featured project`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete featured project:", error);
    return NextResponse.json({ error: "Failed to delete featured project" }, { status: 500 });
  }
}
