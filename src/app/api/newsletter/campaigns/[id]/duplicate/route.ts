import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const original = await prisma.campaign.findUnique({
      where: { id },
      include: { template: true, segment: true },
    });

    if (!original) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: `${original.name} (Copy)`,
        subject: original.subject,
        previewText: original.previewText,
        senderName: original.senderName,
        senderEmail: original.senderEmail,
        content: original.content,
        status: "DRAFT",
        templateId: original.templateId,
        segmentId: original.segmentId,
        abTestEnabled: original.abTestEnabled,
        abTestVariantA: original.abTestVariantA,
        abTestVariantB: original.abTestVariantB,
        testEmails: original.testEmails,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Failed to duplicate campaign:", error);
    return NextResponse.json({ error: "Failed to duplicate campaign" }, { status: 500 });
  }
}
