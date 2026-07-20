import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const subscribers = await prisma.subscriber.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        subscribedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const grouped = new Map<string, typeof subscribers>();
    for (const sub of subscribers) {
      const key = sub.email.toLowerCase();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(sub);
    }

    const groups = Array.from(grouped.entries())
      .filter(([, subs]) => subs.length > 1)
      .map(([email, subs]) => ({
        email,
        count: subs.length,
        subscribers: subs.map((s) => ({
          id: s.id,
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          status: s.status,
          subscribedAt: s.subscribedAt,
          createdAt: s.createdAt,
        })),
      }));

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Failed to find duplicate subscribers:", error);
    return NextResponse.json({ error: "Failed to find duplicates" }, { status: 500 });
  }
}
