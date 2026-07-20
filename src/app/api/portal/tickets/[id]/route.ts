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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = getEmailFromToken(request);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, email },
    include: {
      status: { select: { name: true, color: true, slug: true, isClosed: true } },
      priority: { select: { name: true, color: true, level: true } },
      category: { select: { name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          isStaff: true,
          staffName: true,
          createdAt: true,
          author: { select: { id: true, name: true, email: true } },
        },
      },
      attachments: {
        select: { id: true, fileName: true, url: true },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}
