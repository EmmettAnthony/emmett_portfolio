import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ logs: [], total: 0, page: 1, limit: 20, totalPages: 0 }, { status: 200 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" as const } },
        { subject: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (status) where.status = status;

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type assertion for external API
      prisma.emailLog.count({ where: where as any }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch email history:", error);
    return NextResponse.json({ logs: [], total: 0, page: 1, limit: 20, totalPages: 0 }, { status: 200 });
  }
}
