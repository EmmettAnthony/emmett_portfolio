import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { createServicePackageSchema } from "@/lib/validations/services";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const packages = await prisma.servicePackage.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Failed to fetch service packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch service packages" },
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
    const parsed = createServicePackageSchema.safeParse(body);

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

    const pkg = await prisma.servicePackage.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        features: data.features as never,
        deliveryTime: data.deliveryTime ?? null,
        revisions: data.revisions ?? 0,
        supportDuration: data.supportDuration ?? null,
        isPopular: data.isPopular ?? false,
        order: data.order ?? 0,
        serviceId: data.serviceId,
      },
    });

    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    console.error("Failed to create service package:", error);
    return NextResponse.json(
      { error: "Failed to create service package" },
      { status: 500 }
    );
  }
}
