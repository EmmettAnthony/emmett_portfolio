import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyNewSubscriber } from "@/lib/notifications/event-handlers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.findFirst({
      where: { verificationToken: token },
    });

    if (!subscriber) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 404 });
    }

    if (subscriber.verifiedAt) {
      return NextResponse.json({ message: "Email already verified" });
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        verifiedAt: new Date(),
        verificationToken: null,
        subscribedAt: new Date(),
      },
    });

    try {
      await prisma.analyticsEvent.create({
        data: { event: "newsletter_verify", label: subscriber.email },
      });
    } catch {}

    // Fire notification that the subscriber has confirmed their email
    const fullName = `${subscriber.firstName} ${subscriber.lastName}`.trim() || subscriber.email;
    notifyNewSubscriber(fullName, subscriber.email, subscriber.source || "email_verification").catch(() => {});

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Failed to verify email:", error);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
