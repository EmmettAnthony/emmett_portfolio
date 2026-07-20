import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.contactFaq.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.question !== undefined) updateData.question = body.question;
    if (body.answer !== undefined) updateData.answer = body.answer;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.published !== undefined) updateData.published = body.published;

    const faq = await prisma.contactFaq.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error("Failed to update contact FAQ:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.contactFaq.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    await prisma.contactFaq.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contact FAQ:", error);
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
