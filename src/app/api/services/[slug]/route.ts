import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const service = await prisma.service.findUnique({
      where: { slug, published: true },
      include: {
        category: true,
        packages: {
          where: { service: { published: true } },
          orderBy: { order: "asc" },
        },
        faqs: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Increment viewCount (fire and forget)
    prisma.service
      .update({
        where: { id: service.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {
        // Silently handle view count increment failures
      });

    // Also fetch global FAQs (where serviceId is null)
    const globalFaqs = await prisma.serviceFAQ.findMany({
      where: { serviceId: null },
      orderBy: { order: "asc" },
    });

    // Fetch testimonials linked to this service
    const testimonialIds: string[] = Array.isArray(service.testimonialIds) ? service.testimonialIds as string[] : [];
    let testimonials: unknown[] = [];
    if (testimonialIds.length > 0) {
      testimonials = await prisma.testimonial.findMany({
        where: { id: { in: testimonialIds }, status: "APPROVED", archived: false },
      });
    }

    return NextResponse.json({ service, globalFaqs, testimonials });
  } catch (error) {
    console.error("Failed to fetch service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}
