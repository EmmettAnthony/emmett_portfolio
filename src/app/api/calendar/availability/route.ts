import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { createAvailabilitySchema, updateAvailabilitySchema } from "@/lib/validations/calendar";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    const availability = await prisma.availability.findMany({
      orderBy: { dayOfWeek: "asc" },
    });
    return NextResponse.json({ availability });
  } catch (error) {
    captureError(error, "Failed to fetch availability");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createAvailabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();

    const existing = await prisma.availability.findUnique({ where: { dayOfWeek: data.dayOfWeek } });
    if (existing) {
      const availability = await prisma.availability.update({
        where: { dayOfWeek: data.dayOfWeek },
        data: {
          isActive: data.isActive,
          startTime: data.startTime,
          endTime: data.endTime,
          breakStart: data.breakStart,
          breakEnd: data.breakEnd,
          slotDuration: data.slotDuration,
        },
      });
      return NextResponse.json({ availability });
    }

    const availability = await prisma.availability.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        isActive: data.isActive,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd,
        slotDuration: data.slotDuration,
      },
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    captureError(error, "Failed to create/update availability");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const parsed = updateAvailabilitySchema.safeParse(updateData);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const prisma = getPrisma();
    const availability = await prisma.availability.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ availability });
  } catch (error) {
    captureError(error, "Failed to update availability");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
