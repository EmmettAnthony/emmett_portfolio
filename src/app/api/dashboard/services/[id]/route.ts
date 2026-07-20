import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { updateServiceSchema } from "@/lib/validations/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        packages: { orderBy: { order: "asc" } },
        faqs: { orderBy: { order: "asc" } },
        inquiries: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Failed to fetch service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.service.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A service with this slug already exists" },
          { status: 409 }
        );
      }
    }

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.galleryImages !== undefined) updateData.galleryImages = JSON.parse(JSON.stringify(data.galleryImages)) as never;
    if (data.features !== undefined) updateData.features = JSON.parse(JSON.stringify(data.features)) as never;
    if (data.benefits !== undefined) updateData.benefits = JSON.parse(JSON.stringify(data.benefits)) as never;
    if (data.technologies !== undefined) updateData.technologies = JSON.parse(JSON.stringify(data.technologies)) as never;
    if (data.deliverables !== undefined) updateData.deliverables = JSON.parse(JSON.stringify(data.deliverables)) as never;
    if (data.estimatedTimeline !== undefined) updateData.estimatedTimeline = data.estimatedTimeline;
    if (data.startingPrice !== undefined) updateData.startingPrice = data.startingPrice;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.published !== undefined) updateData.published = data.published;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.ogImage !== undefined) updateData.ogImage = data.ogImage;
    if (data.canonicalUrl !== undefined) updateData.canonicalUrl = data.canonicalUrl;
    if (data.testimonialIds !== undefined) updateData.testimonialIds = JSON.parse(JSON.stringify(data.testimonialIds)) as never;
    if (data.tags !== undefined) updateData.tags = JSON.parse(JSON.stringify(data.tags)) as never;

    if (data.packages !== undefined) {
      const existingPackageIds = (await prisma.servicePackage.findMany({
        where: { serviceId: id },
        select: { id: true },
      })).map((p) => p.id);

      if (existingPackageIds.length > 0) {
        await prisma.servicePackage.deleteMany({
          where: { id: { in: existingPackageIds } },
        });
      }

      if (data.packages.length > 0) {
        await prisma.servicePackage.createMany({
          data: data.packages.map((pkg) => ({
            name: pkg.name,
            description: pkg.description ?? null,
            price: pkg.price,
            features: JSON.parse(JSON.stringify(pkg.features)) as never,
            deliveryTime: pkg.deliveryTime ?? null,
            revisions: pkg.revisions ?? 0,
            supportDuration: pkg.supportDuration ?? null,
            isPopular: pkg.isPopular ?? false,
            order: pkg.order ?? 0,
            serviceId: id,
          })),
        });
      }
    }

    if (data.faqs !== undefined) {
      const existingFaqIds = (await prisma.serviceFAQ.findMany({
        where: { serviceId: id },
        select: { id: true },
      })).map((f) => f.id);

      if (existingFaqIds.length > 0) {
        await prisma.serviceFAQ.deleteMany({
          where: { id: { in: existingFaqIds } },
        });
      }

      if (data.faqs.length > 0) {
        await prisma.serviceFAQ.createMany({
          data: data.faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
            order: faq.order ?? 0,
            serviceId: id,
          })),
        });
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        packages: { orderBy: { order: "asc" } },
        faqs: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Failed to update service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
