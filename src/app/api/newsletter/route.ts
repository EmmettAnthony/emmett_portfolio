import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { newsletterSignupSchema } from "@/lib/validations/newsletter";

export async function POST(request: Request) {
  try {
    const { success: allowed } = await rateLimit(
      `newsletter:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`,
      5,
      60_000,
    );
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = newsletterSignupSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat().filter(Boolean)[0];
      return NextResponse.json(
        { error: firstError || "Invalid input. Please check your data." },
        { status: 400 }
      );
    }

    const { name, email, gdprConsent, source } = parsed.data;
    const firstName = name?.trim().split(" ")[0] || "";
    const lastName = name?.trim().split(" ").slice(1).join(" ") || "";

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        await prisma.subscriber.update({
          where: { email },
          data: { status: "ACTIVE", gdprConsent: gdprConsent as boolean, subscribedAt: new Date() },
        });
        return NextResponse.json({ message: "Re-subscribed successfully" });
      }
      return NextResponse.json({ message: "Already subscribed" }, { status: 200 });
    }

    await prisma.subscriber.create({
      data: {
        firstName,
        lastName,
        email,
        gdprConsent: gdprConsent as boolean,
        source: source || null,
        status: "ACTIVE",
      },
    });

    try {
      await prisma.analyticsEvent.create({
        data: { event: "newsletter_signup", label: email },
      });
    } catch {}

    return NextResponse.json({ message: "Subscribed successfully" }, { status: 201 });
  } catch (error) {
    console.error("Failed to subscribe:", error);
    return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
  }
}
