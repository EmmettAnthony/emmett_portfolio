import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { aboutTechnologySchema } from "@/lib/validations/about";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = aboutTechnologySchema.parse(body);

    const technology = await prisma.aboutTechnology.update({
      where: { id },
      data: {
        ...validated,
        logo: validated.logo ?? null,
        experienceLevel: validated.experienceLevel ?? null,
      },
    });

    return NextResponse.json({ technology });
  } catch (error) {
    console.error("Failed to update technology:", error);
    return NextResponse.json({ error: "Failed to update technology" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.aboutTechnology.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete technology:", error);
    return NextResponse.json({ error: "Failed to delete technology" }, { status: 500 });
  }
}
