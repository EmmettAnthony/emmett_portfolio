import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function getEmailFromToken(request: NextRequest): string | null {
  const cookie = request.cookies.get("portal_token");
  if (!cookie) return null;
  try {
    const decoded = Buffer.from(cookie.value, "base64").toString("utf-8");
    const [email] = decoded.split(":");
    if (email && email.includes("@")) return email;
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = getEmailFromToken(request);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { body } = await request.json();
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, email },
    include: { status: { select: { name: true, isClosed: true } } },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (ticket.status.isClosed) {
    return NextResponse.json({ error: "Cannot reply to closed tickets" }, { status: 400 });
  }

  const reply = await prisma.supportReply.create({
    data: {
      ticketId: ticket.id,
      body: body.trim(),
      isStaff: false,
    },
  });

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ reply });
}
