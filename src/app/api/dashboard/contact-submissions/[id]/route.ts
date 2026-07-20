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

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    const timelineEntries: { action: string; detail: string }[] = [];

    if (body.status !== undefined && body.status !== existing.status) {
      updateData.status = body.status;
      timelineEntries.push({
        action: "STATUS_CHANGE",
        detail: `Status changed from ${existing.status} to ${body.status}`,
      });
    }

    if (body.notes !== undefined && body.notes !== (existing.notes ?? "")) {
      updateData.notes = body.notes;
      timelineEntries.push({
        action: "NOTE_ADDED",
        detail: "Notes updated",
      });
    }

    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    if (body.tags !== undefined) updateData.tags = body.tags;

    if (body.assignedTo !== undefined && body.assignedTo !== (existing.assignedTo ?? "")) {
      timelineEntries.push({
        action: "ASSIGNED",
        detail: `Assigned to ${body.assignedTo}`,
      });
    }

    if (body.tags !== undefined && body.tags !== (existing.tags ?? "")) {
      timelineEntries.push({
        action: "TAGS_UPDATED",
        detail: `Tags updated to ${body.tags}`,
      });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    });

    if (timelineEntries.length > 0) {
      await prisma.leadTimeline.createMany({
        data: timelineEntries.map((entry) => ({
          contactId: id,
          action: entry.action,
          detail: entry.detail,
        })),
      });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Failed to update contact submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
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

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contact submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
