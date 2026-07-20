"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { updateEmailSettingsSchema } from "@/lib/validations/email";
import { autoLogUpdate } from "@/lib/activity-logger";

export async function getEmailSettings() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const settings = await prisma.emailSetting.findUnique({
    where: { id: "global" },
  });

  if (!settings) {
    return await prisma.emailSetting.create({
      data: { id: "global" },
    });
  }

  return settings;
}

export async function updateEmailSettings(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = updateEmailSettingsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const settings = await prisma.emailSetting.upsert({
    where: { id: "global" },
    create: { id: "global", ...parsed.data },
    update: parsed.data,
  });

  await autoLogUpdate("email", "EmailSetting", "global", "Updated Brevo email settings", session.user.id);

  revalidatePath("/dashboard/email/settings");
  return settings;
}
