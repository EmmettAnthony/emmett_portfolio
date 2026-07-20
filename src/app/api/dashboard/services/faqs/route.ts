import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { createServiceFaqSchema } from "@/lib/validations/services";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    const where: Record<string, unknown> = {};
    if (serviceId) {
      where.serviceId = serviceId;
    }

    const faqs = await prisma.serviceFAQ.findMany({
      where: where as never,
      include: serviceId
        ? undefined
        : { service: { select: { id: true, title: true } } },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("Failed to fetch service FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch service FAQs" },
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
    const parsed = createServiceFaqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId },
      });
      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 }
        );
      }
    }

    const faq = await prisma.serviceFAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        order: data.order ?? 0,
        serviceId: data.serviceId ?? null,
      },
    });

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    console.error("Failed to create service FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create service FAQ" },
      { status: 500 }
    );
  }
}
