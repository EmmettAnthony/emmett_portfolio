import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { aboutStatisticSchema } from "@/lib/validations/about";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const about = await prisma.aboutPage.findFirst();
    if (!about) return NextResponse.json({ statistics: [] });

    const statistics = await prisma.aboutStatistic.findMany({
      where: { aboutId: about.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ statistics });
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = aboutStatisticSchema.parse(body);

    let about = await prisma.aboutPage.findFirst();
    if (!about) {
      about = await prisma.aboutPage.create({ data: { id: "single" } });
    }

    const statistic = await prisma.aboutStatistic.create({
      data: {
        ...validated,
        suffix: validated.suffix ?? null,
        icon: validated.icon ?? null,
        aboutId: about.id,
      },
    });

    return NextResponse.json({ statistic });
  } catch (error) {
    console.error("Failed to create statistic:", error);
    return NextResponse.json({ error: "Failed to create statistic" }, { status: 500 });
  }
}
