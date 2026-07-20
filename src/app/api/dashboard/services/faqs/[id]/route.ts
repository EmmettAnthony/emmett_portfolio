import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { updateServiceFaqSchema } from "@/lib/validations/services";

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
    const faq = await prisma.serviceFAQ.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, title: true } },
      },
    });

    if (!faq) {
      return NextResponse.json(
        { error: "FAQ not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ faq });
  } catch (error) {
    console.error("Failed to fetch service FAQ:", error);
    return NextResponse.json(
      { error: "Failed to fetch service FAQ" },
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
    const parsed = updateServiceFaqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.serviceFAQ.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "FAQ not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    if (data.serviceId && data.serviceId !== existing.serviceId) {
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

    const updateData: Record<string, unknown> = {};
    if (data.question !== undefined) updateData.question = data.question;
    if (data.answer !== undefined) updateData.answer = data.answer;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.serviceId !== undefined) updateData.serviceId = data.serviceId;

    const faq = await prisma.serviceFAQ.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error("Failed to update service FAQ:", error);
    return NextResponse.json(
      { error: "Failed to update service FAQ" },
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
    const existing = await prisma.serviceFAQ.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "FAQ not found" },
        { status: 404 }
      );
    }

    await prisma.serviceFAQ.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete service FAQ:", error);
    return NextResponse.json(
      { error: "Failed to delete service FAQ" },
      { status: 500 }
    );
  }
}
