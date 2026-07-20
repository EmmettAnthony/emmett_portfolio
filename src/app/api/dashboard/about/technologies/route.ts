import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { aboutTechnologySchema } from "@/lib/validations/about";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const about = await prisma.aboutPage.findFirst();
    if (!about) return NextResponse.json({ technologies: [] });

    const technologies = await prisma.aboutTechnology.findMany({
      where: { aboutId: about.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ technologies });
  } catch (error) {
    console.error("Failed to fetch technologies:", error);
    return NextResponse.json({ error: "Failed to fetch technologies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = aboutTechnologySchema.parse(body);

    let about = await prisma.aboutPage.findFirst();
    if (!about) {
      about = await prisma.aboutPage.create({ data: { id: "single" } });
    }

    const technology = await prisma.aboutTechnology.create({
      data: {
        ...validated,
        logo: validated.logo ?? null,
        experienceLevel: validated.experienceLevel ?? null,
        aboutId: about.id,
      },
    });

    return NextResponse.json({ technology });
  } catch (error) {
    console.error("Failed to create technology:", error);
    return NextResponse.json({ error: "Failed to create technology" }, { status: 500 });
  }
}
