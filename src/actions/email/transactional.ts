"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getBrevo } from "@/lib/brevo/client";
import { sendTransactionalEmailSchema } from "@/lib/validations/email";
import { autoLogCreate } from "@/lib/activity-logger";

export async function sendTransactionalEmailAction(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = sendTransactionalEmailSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const settings = await prisma.emailSetting.findUnique({ where: { id: "global" } });

  try {
    const brevo = getBrevo();
    const result = await brevo.transactional.sendEmail({
      sender: {
        name: settings?.senderName || "Emmett Anthony",
        email: settings?.senderEmail || "noreply@emmettanthony.dev",
      },
      to: parsed.data.to.map((t: { email: string; name?: string | null }) => ({
        email: t.email,
        ...(t.name ? { name: t.name } : {}),
      })),
      subject: parsed.data.subject,
      htmlContent: parsed.data.htmlContent || undefined,
      textContent: parsed.data.textContent || undefined,
      templateId: parsed.data.templateId || undefined,
      params: parsed.data.params || undefined,
      tags: parsed.data.tags || undefined,
      replyTo: parsed.data.replyTo ? { ...parsed.data.replyTo, name: parsed.data.replyTo.name ?? undefined } : undefined,
      scheduledAt: parsed.data.scheduledAt || undefined,
    });

    // Log the transactional email
    for (const recipient of parsed.data.to) {
      await prisma.emailLog.create({
        data: {
          email: recipient.email,
          subject: parsed.data.subject,
          status: "sent",
          resendId: result.messageId,
          sentAt: new Date(),
          metadata: { type: "transactional", brevoMessageId: result.messageId },
        },
      });
    }

    await autoLogCreate("email", "EmailLog", result.messageId, `Sent transactional email: ${parsed.data.subject}`, session.user.id);

    revalidatePath("/dashboard/email/transactional");
    return { success: true, messageId: result.messageId };
  } catch (err) {
    await autoLogCreate("email", "EmailLog", "failed", `Failed to send transactional email: ${err instanceof Error ? err.message : "Unknown error"}`, session.user.id);
    throw err;
  }
}

export async function getTransactionalEmails(params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  email?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const brevo = getBrevo();
    const result = await brevo.transactional.getEmails({
      limit: params?.limit || 50,
      offset: params?.offset || 0,
      startDate: params?.startDate,
      endDate: params?.endDate,
      email: params?.email,
    });
    return { emails: result.emails, count: result.count };
  } catch {
    // Fallback to local email logs
    const where: Record<string, unknown> = {};
    if (params?.email) where.email = { contains: params.email, mode: "insensitive" };

    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
        where: where as Prisma.EmailLogFindManyArgs["where"],
        orderBy: { createdAt: "desc" },
        take: params?.limit || 50,
        skip: params?.offset || 0,
      }),
      prisma.emailLog.count({ where: where as Prisma.EmailLogCountArgs["where"] }),
    ]);

    return { emails, count: total };
  }
}
