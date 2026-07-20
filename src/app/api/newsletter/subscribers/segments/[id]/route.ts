import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { updateSegmentSchema } from "@/lib/validations/newsletter";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const segment = await prisma.segment.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!segment) return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    return NextResponse.json(segment);
  } catch (error) {
    console.error("Failed to fetch segment:", error);
    return NextResponse.json({ error: "Failed to fetch segment" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSegmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { tagIds, ...data } = parsed.data;

    const segment = await prisma.segment.update({
      where: { id },
      data: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        ...data as any,
        tags: tagIds ? { set: tagIds.map((tid: string) => ({ id: tid })) } : undefined,
      },
    });

    return NextResponse.json({ segment });
  } catch (error) {
    console.error("Failed to update segment:", error);
    return NextResponse.json({ error: "Failed to update segment" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.segment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete segment:", error);
    return NextResponse.json({ error: "Failed to delete segment" }, { status: 500 });
  }
}
