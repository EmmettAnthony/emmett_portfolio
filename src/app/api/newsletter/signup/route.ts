import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { newsletterSignupSchema } from "@/lib/validations/newsletter";
import crypto from "crypto";
import { processWelcomeSeries } from "@/lib/cron/automation-processor";
import { dispatchWebhook } from "@/lib/webhooks";
import { notifyNewSubscriber } from "@/lib/notifications/event-handlers";
import { getBrevo } from "@/lib/brevo/client";

export async function POST(request: Request) {
  try {
    const { success: allowed } = await rateLimit(
      `newsletter-signup:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`,
      5,
      60_000,
    );
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
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

    const existing = await prisma.subscriber.findUnique({
      where: { email },
      include: { unsubscribeReason: true },
    });
    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        await Promise.all([
          prisma.subscriber.update({
            where: { email },
            data: { status: "ACTIVE", gdprConsent: gdprConsent as boolean, subscribedAt: new Date() },
          }),
          existing.unsubscribeReason
            ? prisma.unsubscribeReason.delete({ where: { subscriberId: existing.id } })
            : Promise.resolve(),
        ]);
        syncSubscriberToBrevo({ email, firstName, lastName }).catch(() => {});
        dispatchWebhook("subscribe", { email, firstName, lastName }).catch(() => {});
        return NextResponse.json({ message: "You have been re-subscribed successfully" });
      }
      if (existing.status === "PENDING_VERIFICATION") {
        const verificationToken = crypto.randomBytes(32).toString("hex");
        await prisma.subscriber.update({
          where: { email },
          data: { verificationToken },
        });
        return NextResponse.json({
          message: "Verification email sent. Please check your inbox.",
          verificationToken,
        });
      }
      return NextResponse.json({ message: "You are already subscribed" });
    }

    const settings = await prisma.newsletterSettings.findUnique({ where: { id: "global" } });
    const doubleOptIn = settings?.doubleOptIn ?? true;

    if (doubleOptIn) {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await prisma.subscriber.create({
        data: {
          firstName,
          lastName,
          email,
          gdprConsent: gdprConsent as boolean,
          source: source || null,
          status: "PENDING_VERIFICATION",
          verificationToken,
        },
      });

      syncSubscriberToBrevo({ email, firstName, lastName }).catch(() => {});

      return NextResponse.json({
        message: "Please check your email to confirm your subscription",
        verificationToken,
      });
    }

    const newSubscriber = await prisma.subscriber.create({
      data: {
        firstName,
        lastName,
        email,
        gdprConsent: gdprConsent as boolean,
        source: source || null,
        status: "ACTIVE",
        subscribedAt: new Date(),
      },
    });

    try {
      await prisma.analyticsEvent.create({
        data: { event: "newsletter_signup", label: email },
      });
    } catch {}

    try {
      await processWelcomeSeries(newSubscriber.id);
    } catch {}

    syncSubscriberToBrevo({ email, firstName, lastName }).catch(() => {});

    notifyNewSubscriber(name || email, email, source || "website").catch(() => {});

    dispatchWebhook("subscribe", { email, firstName, lastName }).catch(() => {});

    return NextResponse.json({ message: "Subscribed successfully" }, { status: 201 });
  } catch (error) {
    console.error("Failed to subscribe:", error);
    return NextResponse.json({ error: "Failed to subscribe. Please try again." }, { status: 500 });
  }
}

async function syncSubscriberToBrevo(data: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  try {
    const brevo = getBrevo();
    await brevo.contacts.create({
      email: data.email,
      attributes: {
        FIRSTNAME: data.firstName || undefined,
        LASTNAME: data.lastName || undefined,
      },
      updateEnabled: true,
    });
  } catch {
    // Brevo sync is optional — never block signup on Brevo failure
  }
}
