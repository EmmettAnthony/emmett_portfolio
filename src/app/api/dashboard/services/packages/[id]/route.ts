import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { updateServicePackageSchema } from "@/lib/validations/services";

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
    const pkg = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        service: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ package: pkg });
  } catch (error) {
    console.error("Failed to fetch service package:", error);
    return NextResponse.json(
      { error: "Failed to fetch service package" },
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
    const parsed = updateServicePackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.features !== undefined) updateData.features = data.features as never;
    if (data.deliveryTime !== undefined) updateData.deliveryTime = data.deliveryTime;
    if (data.revisions !== undefined) updateData.revisions = data.revisions;
    if (data.supportDuration !== undefined) updateData.supportDuration = data.supportDuration;
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
    if (data.order !== undefined) updateData.order = data.order;

    const pkg = await prisma.servicePackage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ package: pkg });
  } catch (error) {
    console.error("Failed to update service package:", error);
    return NextResponse.json(
      { error: "Failed to update service package" },
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
    const existing = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    await prisma.servicePackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete service package:", error);
    return NextResponse.json(
      { error: "Failed to delete service package" },
      { status: 500 }
    );
  }
}
