import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";
import { createCampaignSchema } from "@/lib/validations/newsletter";
import { calculateNextRun } from "@/lib/recurring";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: Prisma.CampaignWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          template: { select: { id: true, name: true } },
          segment: { select: { id: true, name: true } },
          _count: { select: { emailLogs: true, events: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = { ...parsed.data } as Record<string, unknown>;

    if (data.recurringFrequency) {
      const nextRun = calculateNextRun(data as Parameters<typeof calculateNextRun>[0]);
      const firstRun = data.scheduledAt ? new Date(data.scheduledAt as string) : nextRun;
      data.scheduledAt = firstRun?.toISOString() ?? null;
      data.status = "SCHEDULED";
      data.recurringNextRunAt = nextRun?.toISOString() ?? null;
    }

    const campaign = await prisma.campaign.create({
      data: data as unknown as Prisma.CampaignCreateInput,
    });

    cache.invalidate("newsletter:analytics");

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
