import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const subscriberId = searchParams.get("subscriberId");
    const campaignId = searchParams.get("campaignId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const where: Record<string, unknown> = {};
    if (subscriberId) where.subscriberId = subscriberId;
    if (campaignId) where.campaignId = campaignId;

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailLog.count({ where }),
    ]);

    return NextResponse.json({
      emailLogs: logs,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch email logs:", error);
    return NextResponse.json({ error: "Failed to fetch email logs" }, { status: 500 });
  }
}
