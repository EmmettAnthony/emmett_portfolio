import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { trustedLogoSchema } from "@/lib/validations/homepage";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = trustedLogoSchema.parse(body);

    const logo = await prisma.trustedLogo.update({
      where: { id },
      data: { ...validated, website: validated.website ?? null },
    });

    return NextResponse.json({ logo });
  } catch (error) {
    console.error("Failed to update logo:", error);
    return NextResponse.json({ error: "Failed to update logo" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.trustedLogo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete logo:", error);
    return NextResponse.json({ error: "Failed to delete logo" }, { status: 500 });
  }
}
