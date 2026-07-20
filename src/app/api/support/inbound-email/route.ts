import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const from = body.from || body.sender || body.From || "";
    const subject = body.subject || body.Subject || "Support Request";
    const text = body.text || body.Text || body.strippedText || body["stripped-text"] || "";
    const html = body.html || body.Html || "";

    const emailMatch = from.match(/<?([^>\s]+@[^>\s]+)>?/);
    const email = emailMatch ? emailMatch[1] : from;
    const name = from.replace(/<[^>]+>/, "").trim() || email;

    if (!email) {
      return NextResponse.json({ error: "No sender email found" }, { status: 400 });
    }

    const defaultStatus = await prisma.supportStatus.findFirst({ where: { isDefault: true } });
    if (!defaultStatus) {
      return NextResponse.json({ error: "No default status configured" }, { status: 500 });
    }
    await prisma.supportTicket.create({
      data: {
        ticketNumber: `EML-${Date.now().toString(36).toUpperCase()}`,
        subject: subject.substring(0, 255),
        description: text || html || "No content",
        fullName: name,
        email,
        source: "email",
        statusId: defaultStatus.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
