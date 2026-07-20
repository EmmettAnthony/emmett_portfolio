import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));

    const prisma = getPrisma();
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { preferredDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: { page, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, email, phone, date: preferredDate, duration, notes, status } = body;
    if (!name || !email || !preferredDate) {
      return NextResponse.json({ error: "Name, email, and date are required" }, { status: 400 });
    }

    const prisma = getPrisma();
    const appointment = await prisma.appointment.create({
      data: {
        name, email, phone, notes,
        preferredDate: new Date(preferredDate),
        duration: duration || 30,
        status: status || "PENDING",
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
