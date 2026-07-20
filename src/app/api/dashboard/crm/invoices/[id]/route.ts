import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import {
  notifyInvoicePaid,
  notifyInvoiceOverdue
} from "@/lib/notifications/event-handlers";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const invoice = await prisma.crmInvoice.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!invoice) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("CRM invoice GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch existing invoice to detect status transitions
    const existing = await prisma.crmInvoice.findUnique({ where: { id }, include: { client: true } });
    if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const invoice = await prisma.crmInvoice.update({ where: { id }, data: body });

    // Build client name helper for notifications
    const clientName = existing.client
      ? `${existing.client.firstName} ${existing.client.lastName || ""}`.trim()
      : "Unknown";
    const displayNumber = invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase();

    // Fire notification when invoice is marked as paid
    if (body.status === "PAID" && existing.status !== "PAID") {
      const paidDate = new Date().toLocaleDateString();
      notifyInvoicePaid(
        displayNumber,
        clientName,
        Number(invoice.amount) || 0,
        paidDate,
        `/dashboard/crm/invoices/${id}`
      ).catch(() => {});
    }

    // Fire notification when invoice becomes overdue
    if (body.status === "OVERDUE" && existing.status !== "OVERDUE") {
      notifyInvoiceOverdue(
        displayNumber,
        clientName,
        Number(invoice.amount) || 0,
        invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"
      ).catch(() => {});
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("CRM invoice PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.crmInvoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRM invoice DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
