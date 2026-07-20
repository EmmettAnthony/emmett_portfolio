import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");

    const where: Record<string, unknown> = {};
    if (published === "true") where.published = true;

    const faqs = await prisma.contactFaq.findMany({
      where: where as never,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("Failed to fetch contact FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await import("@/../auth").then((m) => m.auth());
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question, answer, category, order, published } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const faq = await prisma.contactFaq.create({
      data: {
        question,
        answer,
        category: category || null,
        order: typeof order === "number" ? order : 0,
        published: published !== false,
      },
    });

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    console.error("Failed to create contact FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}
