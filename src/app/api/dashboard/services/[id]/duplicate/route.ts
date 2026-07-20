import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const original = await prisma.service.findUnique({
      where: { id },
      include: {
        packages: true,
        faqs: true,
      },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const newTitle = `${original.title} (Copy)`;
    let newSlug = `${original.slug}-copy`;
    let slugSuffix = 1;
    while (await prisma.service.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${original.slug}-copy-${slugSuffix}`;
      slugSuffix++;
    }

    const cast = <T>(v: unknown): T => v as T;
    const service = await prisma.service.create({
      data: {
        title: newTitle,
        slug: newSlug,
        shortDescription: original.shortDescription,
        fullDescription: original.fullDescription,
        categoryId: original.categoryId,
        icon: original.icon,
        featuredImage: original.featuredImage,
        galleryImages: cast(original.galleryImages),
        features: cast(original.features),
        benefits: cast(original.benefits),
        technologies: cast(original.technologies),
        deliverables: cast(original.deliverables),
        estimatedTimeline: original.estimatedTimeline,
        startingPrice: original.startingPrice,
        featured: false,
        published: false,
        order: original.order,
        metaTitle: original.metaTitle ? `${original.metaTitle} (Copy)` : null,
        metaDescription: original.metaDescription,
        ogImage: original.ogImage,
        canonicalUrl: original.canonicalUrl,
        testimonialIds: cast(original.testimonialIds),
        tags: cast(original.tags),
        packages: {
          create: original.packages.map((pkg) => ({
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            features: cast(pkg.features),
            deliveryTime: pkg.deliveryTime,
            revisions: pkg.revisions,
            supportDuration: pkg.supportDuration,
            isPopular: pkg.isPopular,
            order: pkg.order,
          })),
        },
        faqs: {
          create: original.faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
            order: faq.order,
          })),
        },
      },
      include: {
        category: true,
        packages: { orderBy: { order: "asc" } },
        faqs: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Failed to duplicate service:", error);
    return NextResponse.json(
      { error: "Failed to duplicate service" },
      { status: 500 }
    );
  }
}
