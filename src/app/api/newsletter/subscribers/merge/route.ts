import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { keepEmail, mergeEmail } = await request.json();

    if (!keepEmail || !mergeEmail) {
      return NextResponse.json({ error: "keepEmail and mergeEmail are required" }, { status: 400 });
    }

    if (keepEmail.toLowerCase() !== mergeEmail.toLowerCase()) {
      return NextResponse.json({ error: "Emails must be the same (case-insensitive)" }, { status: 400 });
    }

    const [keepSubscriber, mergeSubscriber] = await Promise.all([
      prisma.subscriber.findUnique({ where: { email: keepEmail } }),
      prisma.subscriber.findUnique({ where: { email: mergeEmail } }),
    ]);

    if (!keepSubscriber) {
      return NextResponse.json({ error: "Keep subscriber not found" }, { status: 404 });
    }
    if (!mergeSubscriber) {
      return NextResponse.json({ error: "Merge subscriber not found" }, { status: 404 });
    }
    if (keepSubscriber.id === mergeSubscriber.id) {
      return NextResponse.json({ error: "Cannot merge a subscriber with itself" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.campaignEvent.updateMany({
        where: { subscriberId: mergeSubscriber.id },
        data: { subscriberId: keepSubscriber.id },
      });

      await tx.emailLog.updateMany({
        where: { subscriberId: mergeSubscriber.id },
        data: { subscriberId: keepSubscriber.id },
      });

      const mergeFieldValues = await tx.customFieldValue.findMany({
        where: { subscriberId: mergeSubscriber.id },
      });

      for (const fv of mergeFieldValues) {
        const existing = await tx.customFieldValue.findUnique({
          where: {
            customFieldId_subscriberId: {
              customFieldId: fv.customFieldId,
              subscriberId: keepSubscriber.id,
            },
          },
        });
        if (existing) {
          await tx.customFieldValue.delete({ where: { id: fv.id } });
        } else {
          await tx.customFieldValue.update({
            where: { id: fv.id },
            data: { subscriberId: keepSubscriber.id },
          });
        }
      }

      await tx.subscriber.delete({ where: { id: mergeSubscriber.id } });
    });

    const subscriber = await prisma.subscriber.findUnique({
      where: { id: keepSubscriber.id },
      include: { preferences: true },
    });

    return NextResponse.json({ subscriber });
  } catch (error) {
    console.error("Failed to merge subscribers:", error);
    return NextResponse.json({ error: "Failed to merge subscribers" }, { status: 500 });
  }
}
