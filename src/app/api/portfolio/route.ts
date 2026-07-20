import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const technology = searchParams.get("technology");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") ?? "date";

    const where: Record<string, unknown> = {
      published: true,
    };

    if (category) {
      where.category = { slug: category };
    }

    if (technology) {
      where.technologies = {
        some: { slug: technology },
      };
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: Record<string, string>;
    switch (sort) {
      case "title":
        orderBy = { title: "asc" };
        break;
      case "views":
        orderBy = { viewCount: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const projects = await prisma.portfolioProject.findMany({
      where: where as never,
      include: {
        category: true,
        technologies: true,
      },
      orderBy,
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch portfolio projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio projects" },
      { status: 500 }
    );
  }
}
