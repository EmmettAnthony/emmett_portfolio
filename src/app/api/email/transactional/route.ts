import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ emails: [], count: 0 }, { status: 200 });

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (email) {
      where.email = { contains: email, mode: "insensitive" as const };
    }

    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        where: where as any,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type assertion for external API
      prisma.emailLog.count({ where: where as any }),
    ]);

    return NextResponse.json({ emails, count: total });
  } catch (error) {
    console.error("Failed to fetch transactional emails:", error);
    return NextResponse.json({ emails: [], count: 0 }, { status: 200 });
  }
}
