import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const meetingType = await prisma.meetingType.findUnique({
      where: { slug },
    });
    if (!meetingType) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(meetingType);
  }

  const meetingTypes = await prisma.meetingType.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(meetingTypes);
}
