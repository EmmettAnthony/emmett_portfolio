import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { withActivityLog } from "@/lib/activity-wrappers";
import { notifyCrmLeadCreated } from "@/lib/notifications/event-handlers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (source) where.source = source;

    const [leads, total] = await Promise.all([
      prisma.crmLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.crmLead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("CRM leads GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── POST /api/dashboard/crm/leads ───────────────────────────────────────
const postLeadHandler = async (_request: NextRequest, _context: { userId: string }) => {
  try {
    const body = await _request.json();
    const lead = await prisma.crmLead.create({ data: body });

    // Fire notification for new CRM lead
    const leadName = `${lead.firstName} ${lead.lastName}`.trim() || lead.email;
    notifyCrmLeadCreated(
      leadName,
      lead.email,
      lead.source || "MANUAL",
      `/dashboard/crm/leads/${lead.id}`
    ).catch(() => {});

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("CRM leads POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

export const POST = withActivityLog(
  "create",
  "crm",
  "Created CRM lead",
)(postLeadHandler);
