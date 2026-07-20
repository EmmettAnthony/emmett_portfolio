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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.crmClient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { company: true },
      }),
      prisma.crmClient.count({ where }),
    ]);

    return NextResponse.json({ clients, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("CRM clients GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── POST /api/dashboard/crm/clients ─────────────────────────────────────
const postClientHandler = async (_request: NextRequest, _context: { userId: string }) => {
  try {
    const body = await _request.json();
    const client = await prisma.crmClient.create({ data: body });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("CRM clients POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

export const POST = withActivityLog(
  "create",
  "crm",
  "Created CRM client",
)(postClientHandler);
