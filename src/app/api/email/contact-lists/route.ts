import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { getBrevo } from "@/lib/brevo/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json([], { status: 200 });

    const lists = await prisma.contactList.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      include: { _count: { select: { members: true } } },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error("Failed to fetch contact lists:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    let brevoList;
    try {
      const brevo = getBrevo();
      const folders = await brevo.folders.list({ limit: 1 });
      let folderId = folders.folders?.[0]?.id;
      if (!folderId) {
        const newFolder = await brevo.folders.create({ name: "Email Lists" });
        folderId = newFolder.id;
      }
      brevoList = await brevo.lists.create({ listName: data.name, folderId });
    } catch (e) {
      console.warn("Brevo sync failed (optional):", e);
    }

    const list = await prisma.contactList.create({
      data: {
        name: data.name,
        description: data.description || null,
        brevoId: brevoList?.id || null,
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("Failed to create contact list:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create: " + message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.contactList.update({
      where: { id },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contact list:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
