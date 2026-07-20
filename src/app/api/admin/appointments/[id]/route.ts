import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Failed to fetch appointment:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, date, duration, notes, status } = body;
    const prisma = getPrisma();
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(duration !== undefined && { duration }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    });
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Failed to update appointment:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete appointment:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
