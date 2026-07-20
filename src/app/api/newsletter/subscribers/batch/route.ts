import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, subscriberIds, value } = body;

    if (!action || !subscriberIds || !Array.isArray(subscriberIds) || subscriberIds.length === 0) {
      return NextResponse.json({ error: "action and subscriberIds array required" }, { status: 400 });
    }

    switch (action) {
      case "delete": {
        await prisma.subscriber.deleteMany({
          where: { id: { in: subscriberIds } },
        });
        return NextResponse.json({ success: true, deleted: subscriberIds.length });
      }

      case "changeStatus": {
        if (!value || !["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING_VERIFICATION"].includes(value)) {
          return NextResponse.json({ error: "Valid status required" }, { status: 400 });
        }
        await prisma.subscriber.updateMany({
          where: { id: { in: subscriberIds } },
          data: { status: value },
        });
        return NextResponse.json({ success: true, updated: subscriberIds.length });
      }

      case "tag": {
        if (!value || typeof value !== "string") {
          return NextResponse.json({ error: "Tag name required" }, { status: 400 });
        }
        const subs = await prisma.subscriber.findMany({
          where: { id: { in: subscriberIds } },
          select: { id: true, tags: true },
        });
        for (const sub of subs) {
          const existingTags: string[] = sub.tags ? sub.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
          if (!existingTags.includes(value)) {
            existingTags.push(value);
          }
          await prisma.subscriber.update({
            where: { id: sub.id },
            data: { tags: existingTags.join(",") },
          });
        }
        return NextResponse.json({ success: true, tagged: subscriberIds.length });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to process batch operation:", error);
    return NextResponse.json({ error: "Failed to process batch operation" }, { status: 500 });
  }
}
