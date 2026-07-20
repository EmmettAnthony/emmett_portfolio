import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { getBrevo } from "@/lib/brevo/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json([], { status: 200 });

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { id: true, name: true } },
        segment: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    // Handle schedule action
    if (data.action === "schedule") {
      const { campaignId, sendAt } = data;
      if (!campaignId || !sendAt) {
        return NextResponse.json({ error: "Missing campaignId or sendAt" }, { status: 400 });
      }

      const existing = await prisma.campaign.findUnique({ where: { id: campaignId } });
      const brevoCampaignId = (existing?.metadata as Record<string, unknown> | null)?.brevoCampaignId;
      if (brevoCampaignId) {
        try {
          const brevo = getBrevo();
          await brevo.campaigns.schedule(Number(brevoCampaignId), { sendAt: new Date(sendAt).toISOString() });
        } catch {
          // Brevo sync is optional
        }
      }

      const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "SCHEDULED",
          scheduledAt: new Date(sendAt),
        },
      });

      return NextResponse.json(campaign);
    }

    // Handle cancel action
    if (data.action === "cancel") {
      const { campaignId } = data;
      if (!campaignId) {
        return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
      }

      const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "DRAFT",
          scheduledAt: null,
        },
      });

      return NextResponse.json(campaign);
    }

    // Build abTestVariantB JSON if A/B testing is enabled
    let abTestVariantB: string | undefined;
    if (data.abTestEnabled) {
      const variantBMeta: Record<string, unknown> = {};
      if (data.subjectB) variantBMeta.subject = data.subjectB;
      if (data.htmlContentB) variantBMeta.content = data.htmlContentB;
      if (Object.keys(variantBMeta).length > 0) {
        abTestVariantB = JSON.stringify(variantBMeta);
      }
    }

    // Build metadata with optional winnerCriteria and listIds
    const metadata: Record<string, unknown> = {};
    if (data.listIds) metadata.listIds = data.listIds;
    if (data.abTestEnabled && data.abTestWinnerCriteria) {
      metadata.winnerCriteria = data.abTestWinnerCriteria;
    }

    // Create new campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        senderName: data.senderName || null,
        senderEmail: data.senderEmail || null,
        content: data.htmlContent || "",
        status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        abTestEnabled: data.abTestEnabled || false,
        abTestVariantB,
        abTestTestPercent: data.abTestTestPercent || 20,
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
        metadata: Object.keys(metadata).length > 0 ? (metadata as any) : undefined,
      },
    });

    // Sync to Brevo
    try {
      const brevo = getBrevo();
      const listIds = data.listIds || [];
      const resolvedListIds = listIds.length > 0
        ? await prisma.contactList.findMany({
            where: { id: { in: listIds }, brevoId: { not: null } },
            select: { brevoId: true },
          }).then((lists) => lists.map((l) => l.brevoId as number))
        : [];

      const brevoCampaign = await brevo.campaigns.create({
        name: data.name,
        subject: data.subject,
        sender: { name: data.senderName || "", email: data.senderEmail || "" },
        type: "classic",
        htmlContent: data.htmlContent || "",
        listIds: resolvedListIds,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
          metadata: { ...(campaign.metadata as any), brevoCampaignId: brevoCampaign.id } as any,
        },
      });
    } catch {
      // Brevo sync is optional
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existing = await prisma.campaign.findUnique({ where: { id } });
    const brevoCampaignId = (existing?.metadata as Record<string, unknown> | null)?.brevoCampaignId;
    if (brevoCampaignId) {
      try {
        const brevo = getBrevo();
        await brevo.campaigns.delete(Number(brevoCampaignId));
      } catch {
        // Brevo sync is optional
      }
    }

    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
