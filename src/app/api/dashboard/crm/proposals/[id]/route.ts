import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { notifyCrmProposalApproved } from "@/lib/notifications/event-handlers";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const proposal = await prisma.crmProposal.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!proposal) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(proposal);
  } catch (error) {
    console.error("CRM proposal GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch existing proposal to detect status transitions
    const existing = await prisma.crmProposal.findUnique({ where: { id }, include: { client: true } });
    if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const proposal = await prisma.crmProposal.update({ where: { id }, data: body });

    // Build client name helper
    const clientName = existing.client
      ? `${existing.client.firstName} ${existing.client.lastName || ""}`.trim()
      : "Unknown";

    // Fire notification when proposal is approved
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
    if (body.status === "APPROVED" && (existing as any).status !== "APPROVED") {
      notifyCrmProposalApproved(
        proposal.title || existing.title || "Untitled Proposal",
        clientName,
        `/dashboard/crm/proposals/${id}`
      ).catch(() => {});
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("CRM proposal PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.crmProposal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRM proposal DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
