"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getBrevo } from "@/lib/brevo/client";
import { newsletterSignupSchema } from "@/lib/validations/email";
import { autoLogCreate } from "@/lib/activity-logger";

export async function subscribeToNewsletterAction(data: Record<string, unknown>) {
  const parsed = newsletterSignupSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  // Check if subscriber exists
  const existingSubscriber = await prisma.subscriber.findUnique({
    where: { email: parsed.data.email },
  });

  let subscriber;
  if (existingSubscriber) {
    if (existingSubscriber.status === "UNSUBSCRIBED" || existingSubscriber.status === "BOUNCED") {
      subscriber = await prisma.subscriber.update({
        where: { id: existingSubscriber.id },
        data: {
          status: "ACTIVE",
          firstName: parsed.data.firstName || existingSubscriber.firstName,
          lastName: parsed.data.lastName || existingSubscriber.lastName,
          country: parsed.data.country || existingSubscriber.country,
        },
      });
    } else {
      return { success: true, message: "Already subscribed" };
    }
  } else {
    subscriber = await prisma.subscriber.create({
      data: {
        firstName: parsed.data.firstName || parsed.data.email.split("@")[0],
        lastName: parsed.data.lastName || "",
        email: parsed.data.email,
        country: parsed.data.country || null,
        tags: parsed.data.interests || null,
        source: parsed.data.source || "newsletter_form",
        gdprConsent: parsed.data.consent,
        status: "ACTIVE",
        subscribedAt: new Date(),
      },
    });
  }

  // Add to contact list member
  if (parsed.data.listId) {
    await prisma.contactListMember.upsert({
      where: { listId_email: { listId: parsed.data.listId, email: parsed.data.email } },
      create: {
        listId: parsed.data.listId,
        email: parsed.data.email,
        firstName: parsed.data.firstName || subscriber.firstName,
        lastName: parsed.data.lastName || subscriber.lastName,
        country: parsed.data.country || null,
        source: parsed.data.source || "newsletter_form",
        status: "ACTIVE",
      },
      update: { status: "ACTIVE" },
    });

    // Sync to Brevo
    try {
      const brevo = getBrevo();
      const list = await prisma.contactList.findUnique({ where: { id: parsed.data.listId } });
      if (list?.brevoId) {
        await brevo.contacts.create({
          email: parsed.data.email,
          attributes: {
            FIRSTNAME: parsed.data.firstName || subscriber.firstName,
            LASTNAME: parsed.data.lastName || undefined,
            COUNTRY: parsed.data.country || undefined,
          },
          listIds: [list.brevoId],
          updateEnabled: true,
        });
      }
    } catch {
      // Brevo sync optional
    }
  }

  await autoLogCreate(
    "newsletter",
    "Subscriber",
    subscriber.id,
    `New newsletter subscriber: ${parsed.data.email}`,
    undefined,
    { source: parsed.data.source || "newsletter_form" }
  );

  revalidatePath("/dashboard/email/subscribers");
  return { success: true, subscriberId: subscriber.id };
}

export async function unsubscribeAction(email: string, reason?: string | null) {
  const subscriber = await prisma.subscriber.findUnique({ where: { email } });
  if (!subscriber) throw new Error("Subscriber not found");

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { status: "UNSUBSCRIBED" },
  });

  if (reason) {
    await prisma.unsubscribeReason.upsert({
      where: { subscriberId: subscriber.id },
      create: { subscriberId: subscriber.id, reason },
      update: { reason },
    });
  }

  // Unsubscribe from Brevo lists
  try {
    const brevo = getBrevo();
    const member = await prisma.contactListMember.findFirst({
      where: { email, status: "ACTIVE" },
      include: { list: true },
    });
    if (member?.list?.brevoId) {
      await brevo.contacts.update(email, {
        unlinkListIds: [member.list.brevoId],
      });
    }
  } catch {
    // Brevo sync optional
  }

  await prisma.contactListMember.updateMany({
    where: { email },
    data: { status: "UNSUBSCRIBED" },
  });

  revalidatePath("/dashboard/email/subscribers");
  return { success: true };
}

export async function getSubscribers(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params?.search) {
    where.OR = [
      { email: { contains: params.search, mode: "insensitive" } },
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params?.status) where.status = params.status;

  const [subscribers, total] = await Promise.all([
    prisma.subscriber.findMany({
      where: where as Prisma.SubscriberFindManyArgs["where"],
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        preferences: true,
        unsubscribeReason: true,
      },
    }),
    prisma.subscriber.count({ where: where as Prisma.SubscriberCountArgs["where"] }),
  ]);

  return {
    subscribers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
