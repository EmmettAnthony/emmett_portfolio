import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const updated = await prisma.supportTicketTemplate.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PUT /api/support/ticket-templates/[id] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.supportTicketTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/support/ticket-templates/[id] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete" }, { status: 400 });
  }
}
