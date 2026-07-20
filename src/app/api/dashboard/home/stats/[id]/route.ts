import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { homepageStatisticSchema } from "@/lib/validations/homepage";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = homepageStatisticSchema.parse(body);
    const stat = await prisma.homepageStatistic.update({
      where: { id },
      data: { ...validated, icon: validated.icon ?? null },
    });
    return NextResponse.json({ stat });
  } catch {
    return NextResponse.json({ error: "Failed to update stat" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.homepageStatistic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete stat" }, { status: 500 });
  }
}
