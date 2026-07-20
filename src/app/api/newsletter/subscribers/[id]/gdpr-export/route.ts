import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
      include: {
        preferences: true,
        unsubscribeReason: true,
        campaignEvents: {
          orderBy: { createdAt: "desc" },
        },
        emailLogs: {
          orderBy: { createdAt: "desc" },
        },
        customFieldValues: {
          include: {
            customField: {
              select: { name: true, slug: true, fieldType: true },
            },
          },
        },
      },
    });

    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    let tags: { id: string; name: string; slug: string; color: string }[] = [];
    if (subscriber.tags) {
      const tagIds = subscriber.tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagIds.length > 0) {
        tags = await prisma.tag.findMany({
          where: { id: { in: tagIds } },
          select: { id: true, name: true, slug: true, color: true },
        });
      }
    }

    let segments: { id: string; name: string; slug: string }[] = [];
    if (tags.length > 0) {
      segments = await prisma.segment.findMany({
        where: {
          tags: {
            some: {
              id: { in: tags.map((t) => t.id) },
            },
          },
        },
        select: { id: true, name: true, slug: true },
      });
    }

    const { customFieldValues, ...subscriberData } = subscriber;

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      subscriber: {
        ...subscriberData,
        events: subscriber.campaignEvents,
        emailLogs: subscriber.emailLogs,
        preferences: subscriber.preferences,
        customFields: customFieldValues.map((cfv) => ({
          id: cfv.id,
          fieldName: cfv.customField.name,
          fieldSlug: cfv.customField.slug,
          fieldType: cfv.customField.fieldType,
          value: cfv.value,
        })),
        tags,
        segments,
      },
    });
  } catch (error) {
    console.error("Failed to export subscriber data:", error);
    return NextResponse.json({ error: "Failed to export subscriber data" }, { status: 500 });
  }
}
