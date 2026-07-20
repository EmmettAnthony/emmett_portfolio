import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { homepageSchema } from "@/lib/validations/homepage";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let homepage = await prisma.homepage.findFirst({
      include: {
        trustedLogos: { orderBy: { order: "asc" } },
        homepageStats: { orderBy: { order: "asc" } },
        homepageTechs: { orderBy: { order: "asc" } },
      },
    });

    if (!homepage) {
      homepage = await prisma.homepage.create({
        data: { id: "single" },
        include: {
          trustedLogos: { orderBy: { order: "asc" } },
          homepageStats: { orderBy: { order: "asc" } },
          homepageTechs: { orderBy: { order: "asc" } },
        },
      });
    }

    return NextResponse.json({ homepage });
  } catch (error) {
    console.error("Failed to fetch homepage:", error);
    return NextResponse.json({ error: "Failed to fetch homepage" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = homepageSchema.parse(body);

    const existing = await prisma.homepage.findFirst();

    const homepage = existing
      ? await prisma.homepage.update({
          where: { id: existing.id },
          data: {
            ...validated,
            whyChooseItems: validated.whyChooseItems ?? [],
            processSteps: validated.processSteps ?? [],
            faqs: validated.faqs ?? [],
          },
          include: {
            trustedLogos: { orderBy: { order: "asc" } },
            homepageStats: { orderBy: { order: "asc" } },
            homepageTechs: { orderBy: { order: "asc" } },
          },
        })
      : await prisma.homepage.create({
          data: {
            id: "single",
            ...validated,
            whyChooseItems: validated.whyChooseItems ?? [],
            processSteps: validated.processSteps ?? [],
            faqs: validated.faqs ?? [],
          },
          include: {
            trustedLogos: { orderBy: { order: "asc" } },
            homepageStats: { orderBy: { order: "asc" } },
            homepageTechs: { orderBy: { order: "asc" } },
          },
        });

    return NextResponse.json({ homepage });
  } catch (error) {
    console.error("Failed to update homepage:", error);
    return NextResponse.json({ error: "Failed to update homepage" }, { status: 500 });
  }
}
