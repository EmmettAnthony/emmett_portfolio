import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updatePreferencesSchema } from "@/lib/validations/newsletter";
import { rateLimit } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { success: getSuccess } = await rateLimit(
    `preferences:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`,
    30,
    60_000,
  );
  if (!getSuccess) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { email },
      include: { preferences: true },
    });

    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    return NextResponse.json({
      subscriber: {
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        email: subscriber.email,
        status: subscriber.status,
      },
      preferences: subscriber.preferences || {
        emailFrequency: "instant",
        receivePromotions: true,
        receiveNewsletters: true,
        receiveBlogUpdates: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { success: putSuccess } = await rateLimit(
    `preferences:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`,
    20,
    60_000,
  );
  if (!putSuccess) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updatePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.findUnique({ where: { email } });
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    const preferences = await prisma.subscriberPreference.upsert({
      where: { subscriberId: subscriber.id },
      create: {
        subscriberId: subscriber.id,
        ...parsed.data,
      } as unknown as Prisma.SubscriberPreferenceCreateInput,
      update: parsed.data as unknown as Prisma.SubscriberPreferenceUpdateInput,
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
