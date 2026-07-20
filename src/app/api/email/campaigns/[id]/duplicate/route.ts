import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const original = await prisma.campaign.findUnique({ where: { id } });
    if (!original) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const duplicate = await prisma.campaign.create({
      data: {
        name: `${original.name} (Copy)`,
        subject: original.subject,
        previewText: original.previewText,
        senderName: original.senderName,
        senderEmail: original.senderEmail,
        content: original.content,
        status: "DRAFT",
      },
    });

    return NextResponse.json(duplicate);
  } catch (error) {
    console.error("Failed to duplicate campaign:", error);
    return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
