import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: { select: { id: true, name: true } },
        segment: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });

    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const data = await req.json();

    // Fetch existing campaign for A/B variant merge
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.htmlContent !== undefined) updateData.content = data.htmlContent;

    // A/B variant B — merge subject + content into JSON
    let abVariantBMeta: Record<string, unknown> = {};
    if (existing.abTestVariantB) {
      try {
        abVariantBMeta = typeof existing.abTestVariantB === "string"
          ? JSON.parse(existing.abTestVariantB)
          : existing.abTestVariantB as Record<string, unknown>;
      } catch { /* ignore */ }
    }
    if (data.htmlContentB !== undefined) abVariantBMeta.content = data.htmlContentB;
    if (data.subjectB !== undefined) abVariantBMeta.subject = data.subjectB;
    if (Object.keys(abVariantBMeta).length > 0) {
      updateData.abTestVariantB = JSON.stringify(abVariantBMeta);
    }

    if (data.abTestEnabled !== undefined) updateData.abTestEnabled = data.abTestEnabled;
    if (data.abTestTestPercent !== undefined) updateData.abTestTestPercent = data.abTestTestPercent;
    if (data.abTestWinnerCriteria !== undefined) {
      const existingMeta = updateData.metadata ? { ...(updateData.metadata as Record<string, unknown>) } : (existing.metadata as Record<string, unknown>) || {};
      updateData.metadata = { ...existingMeta, winnerCriteria: data.abTestWinnerCriteria };
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to update campaign:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
