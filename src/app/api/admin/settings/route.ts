import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    let settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "global" } });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const prisma = getPrisma();
    const settings = await prisma.siteSettings.upsert({
      where: { id: "global" },
      update: {
        siteName: body.siteName ?? undefined,
        tagline: body.tagline ?? undefined,
        logo: body.logo ?? undefined,
        favicon: body.favicon ?? undefined,
        email: body.email ?? undefined,
        phone: body.phone ?? undefined,
        address: body.address ?? undefined,
        social: body.social ?? undefined,
        navigationLinks: body.navigationLinks ?? undefined,
        integrations: body.integrations ?? undefined,
      },
      create: {
        id: "global",
        siteName: body.siteName,
        tagline: body.tagline,
        logo: body.logo,
        favicon: body.favicon,
        email: body.email,
        phone: body.phone,
        address: body.address,
        social: body.social,
        navigationLinks: body.navigationLinks,
        integrations: body.integrations,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
