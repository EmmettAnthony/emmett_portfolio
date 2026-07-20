import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

/**
 * Public endpoint for the booking page.
 * Returns:
 * - Active meeting types with their details
 * - Weekly availability configuration (working hours, breaks, slot durations)
 * - Upcoming date exceptions (holidays, vacations, blocked dates) for the next 60 days
 */
export async function GET() {
  try {
    const prisma = getPrisma();

    const [meetingTypes, availability, dateExceptions] = await Promise.all([
      prisma.meetingType.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          duration: true,
          color: true,
          icon: true,
          location: true,
          link: true,
          price: true,
        },
      }),
      prisma.availability.findMany({
        orderBy: { dayOfWeek: "asc" },
      }),
      prisma.dateException.findMany({
        where: {
          date: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { date: "asc" },
      }),
    ]);

    return NextResponse.json({
      meetingTypes,
      availability,
      dateExceptions,
    });
  } catch (error) {
    console.error("Failed to fetch booking config:", error);
    return NextResponse.json(
      { error: "Failed to load booking configuration" },
      { status: 500 }
    );
  }
}
