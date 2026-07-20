import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, label, metadata } = body;

    if (!event) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }

    await prisma.analyticsEvent.create({
      data: {
        event,
        label: label || null,
        metadata: metadata || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Silently fail - analytics should never block the user experience
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false });
  }
}
