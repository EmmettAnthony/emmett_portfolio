import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { preferredDate: "desc" },
      take: 20,
      include: {
        meetingType: { select: { name: true } },
        contact: { select: { id: true, fullName: true, email: true } },
      },
    });

    const stats = {
      total: await prisma.appointment.count(),
      pending: await prisma.appointment.count({ where: { status: "PENDING" } }),
      confirmed: await prisma.appointment.count({ where: { status: "CONFIRMED" } }),
      completed: await prisma.appointment.count({ where: { status: "COMPLETED" } }),
      cancelled: await prisma.appointment.count({ where: { status: "CANCELLED" } }),
    };

    return NextResponse.json({ appointments, stats });
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
