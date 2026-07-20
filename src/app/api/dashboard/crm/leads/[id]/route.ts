import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { notifyCrmLeadStatusChanged } from "@/lib/notifications/event-handlers";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const lead = await prisma.crmLead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error) {
    console.error("CRM lead GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch existing lead to detect status transitions
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const lead = await prisma.crmLead.update({ where: { id }, data: body });

    // Fire notification when lead status changes
    if (body.status && body.status !== existing.status) {
      const leadName = `${lead.firstName} ${lead.lastName}`.trim();
      notifyCrmLeadStatusChanged(
        leadName,
        existing.status,
        body.status,
        `/dashboard/crm/leads/${id}`
      ).catch(() => {});
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("CRM lead PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.crmLead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRM lead DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
