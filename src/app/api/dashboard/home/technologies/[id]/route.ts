import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { homepageTechnologySchema } from "@/lib/validations/homepage";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = homepageTechnologySchema.parse(body);
    const tech = await prisma.homepageTechnology.update({
      where: { id },
      data: { ...validated, logo: validated.logo ?? null, experienceLevel: validated.experienceLevel ?? null },
    });
    return NextResponse.json({ technology: tech });
  } catch {
    return NextResponse.json({ error: "Failed to update technology" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.homepageTechnology.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete technology" }, { status: 500 });
  }
}
