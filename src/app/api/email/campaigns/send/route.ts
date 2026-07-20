import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { getBrevo } from "@/lib/brevo/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, abTestEnabled } = await req.json();
    if (!campaignId) return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    // Send via Brevo
    const brevoCampaignId = (campaign.metadata as Record<string, unknown> | null)?.brevoCampaignId;
    if (brevoCampaignId && !abTestEnabled && !campaign.abTestEnabled) {
      try {
        const brevo = getBrevo();
        await brevo.campaigns.send(Number(brevoCampaignId));
      } catch {
        // Brevo sync is optional
      }
    }

    // When A/B testing is enabled, set status to AWAITING_WINNER instead of SENDING
    const isAbTest = abTestEnabled || campaign.abTestEnabled;
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: isAbTest ? "AWAITING_WINNER" : "SENDING",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, abTestActive: isAbTest });
  } catch (error) {
    console.error("Failed to send campaign:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
