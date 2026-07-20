import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      items.map((item: { id: string; order: number }) =>
        prisma.portfolioProject.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder projects:", error);
    return NextResponse.json(
      { error: "Failed to reorder projects" },
      { status: 500 }
    );
  }
}
