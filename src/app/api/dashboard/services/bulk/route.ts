import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No service IDs provided" }, { status: 400 });
    }

    switch (action) {
      case "publish":
        await prisma.service.updateMany({
          where: { id: { in: ids } },
          data: { published: true },
        });
        break;
      case "unpublish":
        await prisma.service.updateMany({
          where: { id: { in: ids } },
          data: { published: false },
        });
        break;
      case "feature":
        await prisma.service.updateMany({
          where: { id: { in: ids } },
          data: { featured: true },
        });
        break;
      case "unfeature":
        await prisma.service.updateMany({
          where: { id: { in: ids } },
          data: { featured: false },
        });
        break;
      case "delete":
        await prisma.service.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, action, count: ids.length });
  } catch (error) {
    console.error("Failed to perform bulk action:", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
