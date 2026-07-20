import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId") || "";
    const clientId = searchParams.get("clientId") || "";
    const type = searchParams.get("type") || "";
    const direction = searchParams.get("direction") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (leadId) where.leadId = leadId;
    if (clientId) where.clientId = clientId;
    if (type) where.type = type;
    if (direction) where.direction = direction;

    const [communications, total] = await Promise.all([
      prisma.crmCommunication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.crmCommunication.count({ where }),
    ]);

    return NextResponse.json({ communications, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("CRM communications GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const communication = await prisma.crmCommunication.create({ data: body });
    return NextResponse.json(communication, { status: 201 });
  } catch (error) {
    console.error("CRM communications POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
