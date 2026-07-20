import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids, action } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    if (!action || !["publish", "unpublish", "delete", "archive", "feature", "unfeature"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be one of: publish, unpublish, delete, archive, feature, unfeature" },
        { status: 400 }
      );
    }

    switch (action) {
      case "publish":
        await prisma.portfolioProject.updateMany({
          where: { id: { in: ids } },
          data: { published: true },
        });
        break;
      case "unpublish":
        await prisma.portfolioProject.updateMany({
          where: { id: { in: ids } },
          data: { published: false },
        });
        break;
      case "delete":
        await prisma.portfolioProject.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      case "archive":
        await prisma.portfolioProject.updateMany({
          where: { id: { in: ids } },
          data: { status: "ARCHIVED" },
        });
        break;
      case "feature":
        await prisma.portfolioProject.updateMany({
          where: { id: { in: ids } },
          data: { featured: true },
        });
        break;
      case "unfeature":
        await prisma.portfolioProject.updateMany({
          where: { id: { in: ids } },
          data: { featured: false },
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to execute bulk action:", error);
    return NextResponse.json(
      { error: "Failed to execute bulk action" },
      { status: 500 }
    );
  }
}
