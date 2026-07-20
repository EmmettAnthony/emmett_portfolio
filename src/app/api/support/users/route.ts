import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/support/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
