import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [categories, featuredServices] = await Promise.all([
      prisma.serviceCategory.findMany({
        where: {
          services: {
            some: { published: true },
          },
        },
        include: {
          _count: { select: { services: { where: { published: true } } } },
          services: {
            where: { published: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              shortDescription: true,
              icon: true,
              featuredImage: true,
              startingPrice: true,
              estimatedTimeline: true,
              features: true,
              benefits: true,
              tags: true,
              order: true,
            },
          },
        },
        orderBy: { order: "asc" },
      }),
      prisma.service.findMany({
        where: { published: true, featured: true },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { order: "asc" },
        take: 6,
      }),
    ]);

    return NextResponse.json({ categories, featuredServices });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
