import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { aboutStatisticSchema } from "@/lib/validations/about";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = aboutStatisticSchema.parse(body);

    const statistic = await prisma.aboutStatistic.update({
      where: { id },
      data: {
        ...validated,
        suffix: validated.suffix ?? null,
        icon: validated.icon ?? null,
      },
    });

    return NextResponse.json({ statistic });
  } catch (error) {
    console.error("Failed to update statistic:", error);
    return NextResponse.json({ error: "Failed to update statistic" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.aboutStatistic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete statistic:", error);
    return NextResponse.json({ error: "Failed to delete statistic" }, { status: 500 });
  }
}
