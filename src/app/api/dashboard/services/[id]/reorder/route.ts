import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reorderSchema = z.object({
  order: z.number().int().min(0),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: { order: parsed.data.order },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Failed to reorder service:", error);
    return NextResponse.json(
      { error: "Failed to reorder service" },
      { status: 500 }
    );
  }
}
