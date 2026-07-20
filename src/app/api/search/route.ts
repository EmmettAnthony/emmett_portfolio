import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const query = q;

    const [portfolioResults, blogResults, servicesResults] = await Promise.all([
      prisma.portfolioProject.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { shortDescription: { contains: query, mode: "insensitive" } },
            { fullDescription: { contains: query, mode: "insensitive" } },
            { tags: { string_contains: query } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          featuredImage: true,
        },
        take: 5,
      }),
      prisma.blogPost.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { tags: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          image: true,
        },
        take: 5,
      }),
      prisma.service.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { shortDescription: { contains: query, mode: "insensitive" } },
            { fullDescription: { contains: query, mode: "insensitive" } },
            { tags: { string_contains: query } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          featuredImage: true,
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      portfolio: portfolioResults.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        type: "portfolio",
        excerpt: p.shortDescription,
        image: p.featuredImage,
        url: `/portfolio/${p.slug}`,
      })),
      blog: blogResults.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        type: "blog",
        excerpt: p.excerpt,
        image: p.image,
        url: `/blog/${p.slug}`,
      })),
      services: servicesResults.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        type: "services",
        excerpt: p.shortDescription,
        image: p.featuredImage,
        url: `/services/${p.slug}`,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
