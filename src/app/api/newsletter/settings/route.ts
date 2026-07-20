import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { updateNewsletterSettingsSchema } from "@/lib/validations/newsletter";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    let settings = await prisma.newsletterSettings.findUnique({ where: { id: "global" } });

    if (!settings) {
      settings = await prisma.newsletterSettings.create({
        data: { id: "global" },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to fetch newsletter settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = updateNewsletterSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const settings = await prisma.newsletterSettings.upsert({
      where: { id: "global" },
      create: { id: "global", ...parsed.data } as Prisma.NewsletterSettingsCreateInput,
      update: parsed.data as Prisma.NewsletterSettingsUpdateInput,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to update newsletter settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
