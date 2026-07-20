import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import {
  createMeetingTypeSchema
} from "@/lib/validations/calendar";

export async function GET() {
  try {
    const prisma = getPrisma();
    const meetingTypes = await prisma.meetingType.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ meetingTypes });
  } catch (error) {
    captureError(error, "Failed to fetch meeting types");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createMeetingTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const prisma = getPrisma();
    const meetingType = await prisma.meetingType.create({ data: parsed.data });
    return NextResponse.json({ meetingType }, { status: 201 });
  } catch (error) {
    captureError(error, "Failed to create meeting type");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
