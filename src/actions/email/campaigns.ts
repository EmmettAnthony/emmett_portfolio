"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getBrevo } from "@/lib/brevo/client";
import {
  createEmailCampaignSchema,
  updateEmailCampaignSchema,
  sendTestEmailSchema,
  scheduleCampaignSchema,
} from "@/lib/validations/email";
import { autoLogCreate, autoLogUpdate, autoLogDelete } from "@/lib/activity-logger";

export async function getCampaigns() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { id: true, name: true } },
      segment: { select: { id: true, name: true } },
    },
  });

  return campaigns;
}

export async function getCampaign(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.campaign.findUnique({
    where: { id },
    include: {
      template: true,
      segment: true,
      events: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
}

export async function createCampaignAction(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createEmailCampaignSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const settings = await prisma.emailSetting.findUnique({ where: { id: "global" } });

  const campaign = await prisma.campaign.create({
    data: {
      name: parsed.data.name,
      subject: parsed.data.subject,
      senderName: parsed.data.senderName || settings?.senderName || "Emmett Anthony",
      senderEmail: parsed.data.senderEmail || settings?.senderEmail || undefined,
      content: parsed.data.htmlContent || "",
      status: parsed.data.scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      metadata: {
        listIds: parsed.data.listIds,
        segmentIds: parsed.data.segmentIds || [],
        tag: parsed.data.tag,
        abTesting: parsed.data.abTesting,
      },
    },
  });

  // Create in Brevo
  try {
    const brevo = getBrevo();
    const listIds = await getBrevoListIds(parsed.data.listIds);

    if (listIds.length > 0) {
      const brevoCampaign = await brevo.campaigns.create({
        name: parsed.data.name,
        subject: parsed.data.subject,
        sender: {
          name: campaign.senderName || settings?.senderName || "Emmett Anthony",
          email: campaign.senderEmail || settings?.senderEmail || "noreply@emmettanthony.dev",
        },
        type: "classic",
        htmlContent: parsed.data.htmlContent || "<html><body></body></html>",
        listIds,
        scheduledAt: parsed.data.scheduledAt || undefined,
        tag: parsed.data.tag || undefined,
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { metadata: { ...(campaign.metadata as Record<string, unknown>), brevoCampaignId: brevoCampaign.id } },
      });
    }
  } catch {
    // Brevo sync optional
  }

  await autoLogCreate("email", "Campaign", campaign.id, `Created campaign: ${campaign.name}`, session.user.id);

  revalidatePath("/dashboard/email/campaigns");
  return campaign;
}

export async function updateCampaignAction(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = updateEmailCampaignSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.scheduledAt) updateData.scheduledAt = new Date(parsed.data.scheduledAt);

  const campaign = await prisma.campaign.update({
    where: { id },
    data: updateData as Prisma.CampaignUpdateArgs["data"],
  });

  await autoLogUpdate("email", "Campaign", id, `Updated campaign: ${campaign.name}`, session.user.id);

  revalidatePath("/dashboard/email/campaigns");
  return campaign;
}

export async function sendCampaignAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new Error("Campaign not found");

  const brevoCampaignId = (campaign.metadata as Record<string, unknown> | null)?.brevoCampaignId;
  if (brevoCampaignId) {
    try {
      const brevo = getBrevo();
      await brevo.campaigns.send(Number(brevoCampaignId));
    } catch (err) {
      throw new Error(`Failed to send via Brevo: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  await prisma.campaign.update({
    where: { id },
    data: { status: "SENDING", sentAt: new Date() },
  });

  await autoLogCreate("email", "Campaign", id, `Sent campaign: ${campaign.name}`, session.user.id);

  revalidatePath("/dashboard/email/campaigns");
  return { success: true };
}

export async function scheduleCampaignAction(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = scheduleCampaignSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: parsed.data.campaignId } });
  if (!campaign) throw new Error("Campaign not found");

  const brevoCampaignId = (campaign.metadata as Record<string, unknown> | null)?.brevoCampaignId;
  if (brevoCampaignId) {
    try {
      const brevo = getBrevo();
      await brevo.campaigns.schedule(Number(brevoCampaignId), { sendAt: parsed.data.sendAt });
    } catch (err) {
      throw new Error(`Failed to schedule via Brevo: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  await prisma.campaign.update({
    where: { id: parsed.data.campaignId },
    data: { status: "SCHEDULED", scheduledAt: new Date(parsed.data.sendAt) },
  });

  await autoLogUpdate("email", "Campaign", parsed.data.campaignId, `Scheduled campaign: ${campaign.name}`, session.user.id);

  revalidatePath("/dashboard/email/campaigns");
  return { success: true };
}

export async function duplicateCampaignAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const original = await prisma.campaign.findUnique({ where: { id } });
  if (!original) throw new Error("Campaign not found");

  const duplicate = await prisma.campaign.create({
    data: {
      name: `${original.name} (Copy)`,
      subject: original.subject,
      previewText: original.previewText,
      senderName: original.senderName,
      senderEmail: original.senderEmail,
      content: original.content,
      status: "DRAFT",
      templateId: original.templateId,
      segmentId: original.segmentId,
      metadata: original.metadata as Prisma.InputJsonValue,
    },
  });

  await autoLogCreate("email", "Campaign", duplicate.id, `Duplicated campaign: ${original.name}`, session.user.id);

  revalidatePath("/dashboard/email/campaigns");
  return duplicate;
}

export async function archiveCampaignAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const campaign = await prisma.campaign.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await autoLogUpdate("email", "Campaign", id, `Archived campaign: ${campaign.name}`, session.user.id);

  revalidatePath("/dashboard/email/campaigns");
  return { success: true };
}

export async function deleteCampaignAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new Error("Campaign not found");

  await prisma.campaign.delete({ where: { id } });

  const brevoCampaignId = (campaign.metadata as Record<string, unknown> | null)?.brevoCampaignId;
  if (brevoCampaignId) {
    try {
      const brevo = getBrevo();
      await brevo.campaigns.delete(Number(brevoCampaignId));
    } catch {
      // Brevo sync optional
    }
  }

  await autoLogDelete("email", "Campaign", id, `Deleted campaign: ${campaign.name}`, session.user.id);

  revalidatePath("/dashboard/email/campaigns");
  return { success: true };
}

export async function sendTestEmailAction(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = sendTestEmailSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: parsed.data.campaignId } });
  if (!campaign) throw new Error("Campaign not found");

  const brevoCampaignId = (campaign.metadata as Record<string, unknown> | null)?.brevoCampaignId;
  if (brevoCampaignId) {
    try {
      const brevo = getBrevo();
      await brevo.campaigns.sendTest(Number(brevoCampaignId), { emailTo: parsed.data.emails });
    } catch (err) {
      throw new Error(`Failed to send test via Brevo: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return { success: true, sentTo: parsed.data.emails };
}

async function getBrevoListIds(listIds: string[]): Promise<number[]> {
  const lists = await prisma.contactList.findMany({
    where: { id: { in: listIds }, brevoId: { not: null } },
    select: { brevoId: true },
  });
  return lists.map((l) => l.brevoId as number).filter(Boolean);
}
