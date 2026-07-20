import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const updated = await prisma.supportKnowledgeArticle.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PUT /api/support/knowledge-base/[id] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.supportKnowledgeArticle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE /api/support/knowledge-base/[id] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { helpful } = await request.json();
    const article = await prisma.supportKnowledgeArticle.findUnique({ where: { id } });
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.supportKnowledgeArticle.update({
      where: { id },
      data: {
        helpfulCount: helpful ? (article.helpfulCount || 0) + 1 : (article.helpfulCount || 0),
        notHelpfulCount: !helpful ? (article.notHelpfulCount || 0) + 1 : (article.notHelpfulCount || 0),
      },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PATCH /api/support/knowledge-base/[id] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update" }, { status: 400 });
  }
}
