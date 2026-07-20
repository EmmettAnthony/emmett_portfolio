import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { homepageStatisticSchema } from "@/lib/validations/homepage";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const hp = await prisma.homepage.findFirst();
    if (!hp) return NextResponse.json({ stats: [] });
    const stats = await prisma.homepageStatistic.findMany({
      where: { homepageId: hp.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ stats });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = homepageStatisticSchema.parse(body);
    let hp = await prisma.homepage.findFirst();
    if (!hp) hp = await prisma.homepage.create({ data: { id: "single" } });
    const stat = await prisma.homepageStatistic.create({
      data: { ...validated, icon: validated.icon ?? null, homepageId: hp.id },
    });
    return NextResponse.json({ stat });
  } catch {
    return NextResponse.json({ error: "Failed to create stat" }, { status: 500 });
  }
}
