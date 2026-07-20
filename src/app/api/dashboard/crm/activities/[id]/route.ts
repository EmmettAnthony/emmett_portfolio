import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const activity = await prisma.crmActivity.update({ where: { id }, data: body });
    return NextResponse.json(activity);
  } catch (error) {
    console.error("CRM activity PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.crmActivity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRM activity DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
