import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { homepageTechnologySchema } from "@/lib/validations/homepage";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const hp = await prisma.homepage.findFirst();
    if (!hp) return NextResponse.json({ technologies: [] });
    const technologies = await prisma.homepageTechnology.findMany({
      where: { homepageId: hp.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ technologies });
  } catch {
    return NextResponse.json({ error: "Failed to fetch technologies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const validated = homepageTechnologySchema.parse(body);
    let hp = await prisma.homepage.findFirst();
    if (!hp) hp = await prisma.homepage.create({ data: { id: "single" } });
    const tech = await prisma.homepageTechnology.create({
      data: { ...validated, logo: validated.logo ?? null, experienceLevel: validated.experienceLevel ?? null, homepageId: hp.id },
    });
    return NextResponse.json({ technology: tech });
  } catch {
    return NextResponse.json({ error: "Failed to create technology" }, { status: 500 });
  }
}
