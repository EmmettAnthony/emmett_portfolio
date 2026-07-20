import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ids, status } = body as {
      action: "updateStatus" | "delete";
      ids: string[];
      status?: string;
    };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    if (action === "updateStatus") {
      if (!status) {
        return NextResponse.json(
          { error: "status is required for updateStatus action" },
          { status: 400 }
        );
      }

      const contacts = await prisma.contact.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const validIds = contacts.map((c) => c.id);

      if (validIds.length === 0) {
        return NextResponse.json(
          { error: "No matching submissions found" },
          { status: 404 }
        );
      }

      await prisma.contact.updateMany({
        where: { id: { in: validIds } },
        data: { status },
      });

      await prisma.leadTimeline.createMany({
        data: validIds.map((contactId) => ({
          contactId,
          action: "STATUS_CHANGE",
          detail: `Bulk status update to ${status}`,
        })),
      });

      return NextResponse.json({ success: true, count: validIds.length });
    }

    if (action === "delete") {
      const contacts = await prisma.contact.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      const validIds = contacts.map((c) => c.id);

      if (validIds.length === 0) {
        return NextResponse.json(
          { error: "No matching submissions found" },
          { status: 404 }
        );
      }

      await prisma.contact.deleteMany({
        where: { id: { in: validIds } },
      });

      return NextResponse.json({ success: true, count: validIds.length });
    }

    return NextResponse.json(
      { error: "Invalid action. Must be 'updateStatus' or 'delete'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to process batch operation:", error);
    return NextResponse.json(
      { error: "Failed to process batch operation" },
      { status: 500 }
    );
  }
}
