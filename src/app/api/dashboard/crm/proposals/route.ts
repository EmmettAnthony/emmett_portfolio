import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const [proposals, total] = await Promise.all([
      prisma.crmProposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { client: true },
      }),
      prisma.crmProposal.count({ where }),
    ]);

    return NextResponse.json({ proposals, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("CRM proposals GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const proposal = await prisma.crmProposal.create({ data: body });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("CRM proposals POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
