import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [packages, total] = await Promise.all([
      prisma.servicePackage.findMany({
        where: {
          service: { published: true },
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              slug: true,
              icon: true,
            },
          },
        },
        orderBy: [{ isPopular: "desc" }, { order: "asc" }],
      }),
      prisma.servicePackage.count({
        where: {
          service: { published: true },
        },
      }),
    ]);

    return NextResponse.json({ packages, total });
  } catch (error) {
    console.error("Failed to fetch service packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch service packages" },
      { status: 500 }
    );
  }
}
