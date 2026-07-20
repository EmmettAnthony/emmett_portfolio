import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();

    const prisma = getPrisma();
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
    });

    return NextResponse.json(subscribers);
  } catch (error) {
    console.error("Newsletter GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
