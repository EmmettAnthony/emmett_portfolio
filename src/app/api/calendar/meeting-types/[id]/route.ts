import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { updateMeetingTypeSchema } from "@/lib/validations/calendar";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const meetingType = await prisma.meetingType.findUnique({ where: { id } });
    if (!meetingType) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ meetingType });
  } catch (error) {
    captureError(error, "Failed to fetch meeting type");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMeetingTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const prisma = getPrisma();
    const meetingType = await prisma.meetingType.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ meetingType });
  } catch (error) {
    captureError(error, "Failed to update meeting type");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.meetingType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureError(error, "Failed to delete meeting type");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
