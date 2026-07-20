import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { trustedLogoSchema } from "@/lib/validations/homepage";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const hp = await prisma.homepage.findFirst();
    if (!hp) return NextResponse.json({ logos: [] });

    const logos = await prisma.trustedLogo.findMany({
      where: { homepageId: hp.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ logos });
  } catch (error) {
    console.error("Failed to fetch logos:", error);
    return NextResponse.json({ error: "Failed to fetch logos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const validated = trustedLogoSchema.parse(body);

    let hp = await prisma.homepage.findFirst();
    if (!hp) hp = await prisma.homepage.create({ data: { id: "single" } });

    const logo = await prisma.trustedLogo.create({
      data: { ...validated, website: validated.website ?? null, homepageId: hp.id },
    });

    return NextResponse.json({ logo });
  } catch (error) {
    console.error("Failed to create logo:", error);
    return NextResponse.json({ error: "Failed to create logo" }, { status: 500 });
  }
}
