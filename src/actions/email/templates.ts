"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { autoLogCreate, autoLogUpdate, autoLogDelete } from "@/lib/activity-logger";

export async function getTemplates() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTemplate(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.template.findUnique({ where: { id } });
}

export async function createTemplateAction(data: {
  name: string;
  description?: string | null;
  content?: string;
  category?: string | null;
  thumbnail?: string | null;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const template = await prisma.template.create({
    data: {
      name: data.name,
      description: data.description || null,
      content: data.content || "",
      category: data.category || null,
      thumbnail: data.thumbnail || null,
    },
  });

  await autoLogCreate("email", "Template", template.id, `Created template: ${template.name}`, session.user.id);

  revalidatePath("/dashboard/email/templates");
  return template;
}

export async function updateTemplateAction(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    content?: string;
    category?: string | null;
    thumbnail?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const template = await prisma.template.update({
    where: { id },
    data,
  });

  await autoLogUpdate("email", "Template", id, `Updated template: ${template.name}`, session.user.id);

  revalidatePath("/dashboard/email/templates");
  return template;
}

export async function deleteTemplateAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) throw new Error("Template not found");

  await prisma.template.delete({ where: { id } });

  await autoLogDelete("email", "Template", id, `Deleted template: ${template.name}`, session.user.id);

  revalidatePath("/dashboard/email/templates");
  return { success: true };
}
