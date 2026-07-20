import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const entries = await prisma.blocklistEntry.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch blocklist:", error);
    return NextResponse.json({ error: "Failed to fetch blocklist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { email, reason, notes } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existing = await prisma.blocklistEntry.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "Email already blocklisted" }, { status: 409 });
    }

    const entry = await prisma.blocklistEntry.create({
      data: {
        email: email.toLowerCase().trim(),
        reason: reason || "manual",
        notes: notes || null,
      },
    });

    await prisma.subscriber.updateMany({
      where: { email: email.toLowerCase().trim(), status: "ACTIVE" },
      data: { status: "BOUNCED" },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to add blocklist entry:", error);
    return NextResponse.json({ error: "Failed to add blocklist entry" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (id) {
      await prisma.blocklistEntry.delete({ where: { id } });
    } else if (email) {
      await prisma.blocklistEntry.delete({ where: { email: email.toLowerCase().trim() } });
    } else {
      return NextResponse.json({ error: "Provide id or email" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove blocklist entry:", error);
    return NextResponse.json({ error: "Failed to remove blocklist entry" }, { status: 500 });
  }
}
