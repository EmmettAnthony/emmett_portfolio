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

export async function GET(request: NextRequest) {
  const email = getEmailFromToken(request);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { email },
    include: {
      status: { select: { name: true, color: true, slug: true } },
      priority: { select: { name: true, color: true, level: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ tickets });
}
