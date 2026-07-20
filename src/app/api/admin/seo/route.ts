import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    let seo = await prisma.seoSettings.findUnique({ where: { id: "global" } });
    if (!seo) {
      seo = await prisma.seoSettings.create({ data: { id: "global" } });
    }
    return NextResponse.json(seo);
  } catch (error) {
    console.error("SEO GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const prisma = getPrisma();

    let keywords = body.keywords;
    if (typeof keywords === "string") {
      keywords = JSON.stringify(keywords.split("\n").map((k: string) => k.trim()).filter(Boolean));
    }

    const seo = await prisma.seoSettings.upsert({
      where: { id: "global" },
      update: {
        siteName: body.siteName ?? undefined,
        tagline: body.tagline ?? undefined,
        description: body.description ?? undefined,
        keywords: keywords ?? undefined,
        ogImage: body.ogImage ?? undefined,
        favicon: body.favicon ?? undefined,
        googleVerification: body.googleVerification ?? undefined,
        metaSuffix: body.metaSuffix ?? undefined,
      },
      create: {
        id: "global",
        siteName: body.siteName,
        tagline: body.tagline,
        description: body.description,
        keywords: keywords,
        ogImage: body.ogImage,
        favicon: body.favicon,
        googleVerification: body.googleVerification,
        metaSuffix: body.metaSuffix,
      },
    });

    return NextResponse.json(seo);
  } catch (error) {
    console.error("SEO PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
