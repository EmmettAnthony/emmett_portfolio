import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { notifyCrmDealWon, notifyCrmDealLost } from "@/lib/notifications/event-handlers";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const deal = await prisma.crmDeal.findUnique({
      where: { id },
      include: { lead: true, client: true, company: true, activities: true, tasks: true },
    });
    if (!deal) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(deal);
  } catch (error) {
    console.error("CRM deal GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch existing deal to detect status transitions
    const existing = await prisma.crmDeal.findUnique({ where: { id }, include: { client: true } });
    if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const deal = await prisma.crmDeal.update({ where: { id }, data: body });

    // Build client name helper
    const clientName = existing.client
      ? `${existing.client.firstName} ${existing.client.lastName || ""}`.trim()
      : "Unknown";
    const dealValue = Number(deal.value) || Number(existing.value) || 0;

    // Fire notification when deal is won
    if (body.status === "WON" && (existing as Record<string, unknown>).status !== "WON") {
      notifyCrmDealWon(
        deal.name || existing.name,
        dealValue,
        clientName,
        `/dashboard/crm/deals/${id}`
      ).catch(() => {});
    }

    // Fire notification when deal is lost
    if (body.status === "LOST" && (existing as Record<string, unknown>).status !== "LOST") {
      notifyCrmDealLost(
        deal.name || existing.name,
        dealValue,
        body.lostReason || "Not specified",
        `/dashboard/crm/deals/${id}`
      ).catch(() => {});
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error("CRM deal PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.crmDeal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRM deal DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
