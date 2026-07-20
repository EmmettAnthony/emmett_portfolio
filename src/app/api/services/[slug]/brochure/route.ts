import React from "react";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ReactPDF, { DocumentProps } from "@react-pdf/renderer";
import ServiceBrochurePDF from "@/components/services/ServiceBrochurePDF";

function toArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v));
  return [];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const data = await fetchServiceData(slug);
  if (!data) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const { service } = data;
  const normalized = {
    title: service.title,
    slug: service.slug,
    shortDescription: service.shortDescription,
    startingPrice: service.startingPrice,
    estimatedTimeline: service.estimatedTimeline,
    features: toArray(service.features),
    benefits: toArray(service.benefits),
    technologies: toArray(service.technologies),
    deliverables: toArray(service.deliverables),
    category: service.category,
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic callback type
    packages: (service.packages || []).map((pkg: any) => ({
      name: pkg.name,
      price: pkg.price,
      description: pkg.description,
      deliveryTime: pkg.deliveryTime,
      isPopular: pkg.isPopular,
      features: toArray(pkg.features),
    })),
  };

  const element = React.createElement(ServiceBrochurePDF, { service: normalized }) as unknown;
  const instance = ReactPDF.pdf(element as React.ReactElement<DocumentProps>);
  const blob = await instance.toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${service.slug}-brochure.pdf"`,
    },
  });
}

async function fetchServiceData(slug: string) {
  const service = await prisma.service.findUnique({
    where: { slug, published: true },
    include: {
      category: true,
      packages: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
    },
  });
  if (!service) return null;

  return { service };
}


