import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { withActivityLog } from "@/lib/activity-wrappers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }
    if (stage) where.stage = stage;

    const [deals, total] = await Promise.all([
      prisma.crmDeal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { lead: true, client: true, company: true },
      }),
      prisma.crmDeal.count({ where }),
    ]);

    return NextResponse.json({ deals, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("CRM deals GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── POST /api/dashboard/crm/deals ───────────────────────────────────────
const postDealHandler = async (_request: NextRequest, _context: { userId: string }) => {
  try {
    const body = await _request.json();
    const deal = await prisma.crmDeal.create({ data: body });
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("CRM deals POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

export const POST = withActivityLog(
  "create",
  "crm",
  "Created CRM deal",
)(postDealHandler);
