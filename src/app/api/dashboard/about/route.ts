import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { aboutPageSchema } from "@/lib/validations/about";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let about = await prisma.aboutPage.findFirst({
      include: {
        statistics: { orderBy: { order: "asc" } },
        technologies: { orderBy: { order: "asc" } },
      },
    });

    if (!about) {
      about = await prisma.aboutPage.create({
        data: { id: "single" },
        include: {
          statistics: { orderBy: { order: "asc" } },
          technologies: { orderBy: { order: "asc" } },
        },
      });
    }

    return NextResponse.json({ about });
  } catch (error) {
    console.error("Failed to fetch about page:", error);
    return NextResponse.json({ error: "Failed to fetch about page" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = aboutPageSchema.parse(body);

    const existing = await prisma.aboutPage.findFirst();

    const about = existing
      ? await prisma.aboutPage.update({
          where: { id: existing.id },
          data: {
            ...validated,
            whyWorkWithMe: validated.whyWorkWithMe ?? [],
            workProcess: validated.workProcess ?? [],
            personalInterests: validated.personalInterests ?? [],
            socialLinks: validated.socialLinks ?? [],
            faqs: validated.faqs ?? [],
          },
          include: {
            statistics: { orderBy: { order: "asc" } },
            technologies: { orderBy: { order: "asc" } },
          },
        })
      : await prisma.aboutPage.create({
          data: {
            id: "single",
            ...validated,
            whyWorkWithMe: validated.whyWorkWithMe ?? [],
            workProcess: validated.workProcess ?? [],
            personalInterests: validated.personalInterests ?? [],
            socialLinks: validated.socialLinks ?? [],
            faqs: validated.faqs ?? [],
          },
          include: {
            statistics: { orderBy: { order: "asc" } },
            technologies: { orderBy: { order: "asc" } },
          },
        });

    return NextResponse.json({ about });
  } catch (error) {
    console.error("Failed to update about page:", error);
    return NextResponse.json({ error: "Failed to update about page" }, { status: 500 });
  }
}
