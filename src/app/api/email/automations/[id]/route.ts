import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const data = await req.json();

    const automation = await prisma.automation.update({
      where: { id },
      data: { status: data.status },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Failed to update automation:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
