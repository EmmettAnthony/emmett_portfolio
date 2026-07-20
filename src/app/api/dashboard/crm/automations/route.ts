import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get("trigger") || "";
    const enabled = searchParams.get("enabled") || "";

    const where: Record<string, unknown> = {};

    if (trigger) where.trigger = trigger;
    if (enabled === "true") where.enabled = true;
    if (enabled === "false") where.enabled = false;

    const automations = await prisma.crmAutomation.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ automations, total: automations.length });
  } catch (error) {
    console.error("CRM automations GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const automation = await prisma.crmAutomation.create({ data: body });
    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("CRM automations POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
