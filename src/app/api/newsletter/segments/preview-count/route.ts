import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { segmentId, segmentCriteria } = body;

    let criteria: Record<string, unknown> = {};

    if (segmentId) {
      const segment = await prisma.segment.findUnique({ where: { id: segmentId } });
      if (!segment?.criteria) {
        return NextResponse.json({ count: 0 });
      }
      criteria = segment.criteria as Record<string, unknown>;
    } else if (segmentCriteria) {
      criteria = segmentCriteria;
    } else {
      const count = await prisma.subscriber.count({ where: { status: "ACTIVE" } });
      return NextResponse.json({ count });
    }

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (criteria.countries && Array.isArray(criteria.countries) && criteria.countries.length > 0) {
      where.country = { in: criteria.countries } as Record<string, unknown>;
    }
    if (criteria.sources && Array.isArray(criteria.sources) && criteria.sources.length > 0) {
      where.source = { in: criteria.sources } as Record<string, unknown>;
    }
    if (criteria.status && Array.isArray(criteria.status) && criteria.status.length > 0) {
      where.status = { in: criteria.status } as Record<string, unknown>;
    }
    if (criteria.lastOpenedDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (criteria.lastOpenedDays as number));
      where.lastOpenedAt = { gte: cutoff } as Record<string, unknown>;
    }
    if (criteria.lastClickedDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (criteria.lastClickedDays as number));
      where.lastClickedAt = { gte: cutoff } as Record<string, unknown>;
    }
    if (criteria.subscribedAfter) {
      where.createdAt = { ...(where.createdAt as Record<string, unknown>), gte: new Date(criteria.subscribedAfter as string) };
    }
    if (criteria.subscribedBefore) {
      where.createdAt = { ...(where.createdAt as Record<string, unknown>), lte: new Date(criteria.subscribedBefore as string) };
    }

    const count = await prisma.subscriber.count({ where: where as Record<string, unknown> });
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to preview segment count:", error);
    return NextResponse.json({ error: "Failed to preview count" }, { status: 500 });
  }
}
