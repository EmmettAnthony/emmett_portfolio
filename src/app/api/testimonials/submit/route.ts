import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { notifyNewTestimonial } from "@/lib/notifications/event-handlers";

export async function POST(request: Request) {
  try {
    const { success: allowed } = await rateLimit(
      `testimonial-submit:${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}`,
      3,
      60_000,
    );
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, company, jobTitle, rating, content, photo, honeypot } = body;

    // Spam: honeypot must be empty
    if (honeypot) {
      // Pretend success to avoid alerting bots
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (!name || !content) {
      return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
    }

    const prisma = getPrisma();
    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        email,
        company,
        jobTitle,
        content,
        rating: Math.max(1, Math.min(5, rating ?? 5)),
        photo,
        status: "PENDING_REVIEW",
        submittedAt: new Date(),
      },
    });

    notifyNewTestimonial(name, rating ?? 5, `/dashboard/testimonials`).catch(() => {});

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit testimonial:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
