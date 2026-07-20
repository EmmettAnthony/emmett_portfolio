import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { createServiceSchema } from "@/lib/validations/services";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const where: Record<string, unknown> = {};

    if (published === "true") where.published = true;
    else if (published === "false") where.published = false;

    if (categoryId) where.categoryId = categoryId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: where as never,
        include: {
          category: true,
          _count: { select: { packages: true } },
        },
        orderBy: { order: "asc" },
        skip,
        take: limit,
      }),
      prisma.service.count({ where: where as never }),
    ]);

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existingSlug = await prisma.service.findUnique({
      where: { slug: data.slug },
    });
    if (existingSlug) {
      return NextResponse.json(
        { error: "A service with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const service = await prisma.service.create({
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription ?? null,
        fullDescription: data.fullDescription ?? null,
        categoryId: data.categoryId,
        icon: data.icon ?? null,
        featuredImage: data.featuredImage ?? null,
        galleryImages: JSON.parse(JSON.stringify(data.galleryImages)) as never,
        features: JSON.parse(JSON.stringify(data.features)) as never,
        benefits: JSON.parse(JSON.stringify(data.benefits)) as never,
        technologies: JSON.parse(JSON.stringify(data.technologies)) as never,
        deliverables: JSON.parse(JSON.stringify(data.deliverables)) as never,
        estimatedTimeline: data.estimatedTimeline ?? null,
        startingPrice: data.startingPrice ?? null,
        featured: data.featured ?? false,
        published: data.published ?? false,
        order: data.order ?? 0,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        ogImage: data.ogImage ?? null,
        canonicalUrl: data.canonicalUrl ?? null,
        testimonialIds: JSON.parse(JSON.stringify(data.testimonialIds)) as never,
        tags: JSON.parse(JSON.stringify(data.tags)) as never,
        packages: data.packages && data.packages.length > 0
          ? {
              create: data.packages.map((pkg) => ({
                name: pkg.name,
                description: pkg.description ?? null,
                price: pkg.price,
                features: JSON.parse(JSON.stringify(pkg.features)) as never,
                deliveryTime: pkg.deliveryTime ?? null,
                revisions: pkg.revisions ?? 0,
                supportDuration: pkg.supportDuration ?? null,
                isPopular: pkg.isPopular ?? false,
                order: pkg.order ?? 0,
              })),
            }
          : undefined,
        faqs: data.faqs && data.faqs.length > 0
          ? {
              create: data.faqs.map((faq) => ({
                question: faq.question,
                answer: faq.answer,
                order: faq.order ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        packages: { orderBy: { order: "asc" } },
        faqs: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
