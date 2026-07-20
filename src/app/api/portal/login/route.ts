import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json();

    if (!email || !turnstileToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
      });
      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Verification service error" }, { status: 500 });
    }

    const ticketCount = await prisma.supportTicket.count({ where: { email } });
    if (ticketCount === 0) {
      return NextResponse.json({ error: "No tickets found for this email" }, { status: 404 });
    }

    const token = Buffer.from(`${email}:${Date.now()}:PORTAL_SECRET`).toString("base64");

    return NextResponse.json({ token, email, ticketCount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
