import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const faqs = await prisma.serviceFAQ.findMany({
      where: { serviceId: null },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("Failed to fetch global FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}
