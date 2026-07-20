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
    const dealId = searchParams.get("dealId") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (leadId) where.leadId = leadId;
    if (clientId) where.clientId = clientId;
    if (dealId) where.dealId = dealId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tasks, total] = await Promise.all([
      prisma.crmTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: "asc" },
      }),
      prisma.crmTask.count({ where }),
    ]);

    return NextResponse.json({ tasks, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("CRM tasks GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const task = await prisma.crmTask.create({ data: body });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("CRM tasks POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
