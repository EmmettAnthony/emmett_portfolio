import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { getBrevo } from "@/lib/brevo/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, emails } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "At least one recipient email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emails.filter((e: string) => !emailRegex.test(e));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid email(s): ${invalid.join(", ")}` }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, name: true, subject: true, content: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Get email settings for sender
    const settings = await prisma.emailSetting.findUnique({ where: { id: "global" } });

    // Try to send via Brevo transactional API
    let brevoSuccess = false;
    try {
      const brevo = getBrevo();
      if (campaign.content) {
        await brevo.transactional.sendEmail({
          to: emails.map((email: string) => ({ email })),
          subject: `[TEST] ${campaign.subject || campaign.name}`,
          htmlContent: campaign.content,
          sender: {
            name: settings?.senderName || "Emmett Anthony",
            email: settings?.senderEmail || "noreply@emmettanthony.dev",
          },
          tags: ["test", "campaign-preview"],
        });
        brevoSuccess = true;
      }
    } catch (brevoErr) {
      console.warn("Brevo test send failed, falling back to logging:", brevoErr);
    }

    // Log to email log regardless
    await prisma.emailLog.create({
      data: {
        campaignId: campaign.id,
        email: emails.join(", "),
        subject: `[TEST] ${campaign.subject}`,
        status: brevoSuccess ? "sent" : "failed",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: brevoSuccess,
      sentTo: emails,
      deliveryNote: brevoSuccess
        ? `Test email sent to ${emails.length} recipient(s)`
        : "Test queued (Brevo API unavailable, logged to history)",
    });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}
