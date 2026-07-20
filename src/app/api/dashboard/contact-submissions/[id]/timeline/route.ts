import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const timeline = await prisma.leadTimeline.findMany({
      where: { contactId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Failed to fetch timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
