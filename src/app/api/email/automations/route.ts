import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json([], { status: 200 });

    const automations = await prisma.automation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
      },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Failed to fetch automations:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.automation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete automation:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
