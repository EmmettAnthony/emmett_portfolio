import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { createSubscriberSchema, subscriberFilterSchema } from "@/lib/validations/newsletter";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const parsed = subscriberFilterSchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { search, status, source, country, tag, dateFrom, dateTo, page, limit } = parsed.data;

    const where: Prisma.SubscriberWhereInput = {};

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
    if (country) where.country = country;
    if (tag) where.tags = { contains: tag };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [subscribers, total, counts] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.subscriber.count({ where }),
      Promise.all([
        prisma.subscriber.count({ where: { status: "ACTIVE" } }),
        prisma.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
        prisma.subscriber.count({ where: { status: "BOUNCED" } }),
        prisma.subscriber.count({ where: { status: "PENDING_VERIFICATION" } }),
      ]),
    ]);

    return NextResponse.json({
      subscribers,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      counts: {
        active: counts[0],
        unsubscribed: counts[1],
        bounced: counts[2],
        pending: counts[3],
      },
    });
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createSubscriberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ error: "Subscriber with this email already exists" }, { status: 409 });
    }

    const subscriber = await prisma.subscriber.create({
      data: parsed.data as Prisma.SubscriberCreateInput,
    });

    return NextResponse.json({ subscriber }, { status: 201 });
  } catch (error) {
    console.error("Failed to create subscriber:", error);
    return NextResponse.json({ error: "Failed to create subscriber" }, { status: 500 });
  }
}
