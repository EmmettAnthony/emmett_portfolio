import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { testimonialSchema } from "@/lib/validations/testimonial";
import { notifyTestimonialApproved } from "@/lib/notifications/event-handlers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error("Failed to fetch testimonial:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = testimonialSchema.partial().parse(body);
    const prisma = getPrisma();

    const testimonial = await prisma.testimonial.update({ where: { id }, data: parsed });

    // Fire notification when testimonial status changes to approved
    if (parsed.status === "APPROVED") {
      notifyTestimonialApproved(
        testimonial.name || "Anonymous"
      ).catch(() => {});
    }

    return NextResponse.json({ testimonial });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Validation failed", details: (error as { issues: unknown[] }).issues }, { status: 400 });
    }
    console.error("Failed to update testimonial:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete testimonial:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
