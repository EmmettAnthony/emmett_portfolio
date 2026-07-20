import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const homepage = searchParams.get("homepage");
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "50"));

    const prisma = getPrisma();

    const where: Record<string, unknown> = {
      status: "APPROVED",
      archived: false,
    };

    if (featured === "true") where.featured = true;
    if (homepage === "true") where.displayOnHomepage = true;

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
