import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { createDateExceptionSchema } from "@/lib/validations/calendar";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const prisma = getPrisma();
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (startDate) where.date = { gte: new Date(startDate) };
    if (endDate) where.date = { ...((where.date as Record<string, unknown>) || {}), lte: new Date(endDate) };

    const dateExceptions = await prisma.dateException.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ dateExceptions });
  } catch (error) {
    captureError(error, "Failed to fetch date exceptions");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createDateExceptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();

    const dateException = await prisma.dateException.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        title: data.title,
        isAvailable: data.isAvailable,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
      },
    });

    return NextResponse.json({ dateException }, { status: 201 });
  } catch (error) {
    captureError(error, "Failed to create date exception");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const prisma = getPrisma();
    await prisma.dateException.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureError(error, "Failed to delete date exception");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
