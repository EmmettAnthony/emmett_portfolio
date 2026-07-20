import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const existing = await prisma.subscriber.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    await prisma.subscriber.update({
      where: { id },
      data: {
        email: `deleted-${id}@anonymized`,
        firstName: "GDPR",
        lastName: "Deleted",
        phone: null,
        company: null,
        country: null,
        tags: null,
        timezone: null,
        notes: null,
        verificationToken: null,
        metadata: Prisma.DbNull,
        gdprConsent: false,
      },
    });

    await prisma.subscriberPreference.deleteMany({ where: { subscriberId: id } });
    await prisma.unsubscribeReason.deleteMany({ where: { subscriberId: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to anonymize subscriber:", error);
    return NextResponse.json({ error: "Failed to anonymize subscriber" }, { status: 500 });
  }
}
