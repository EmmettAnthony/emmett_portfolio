import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/api-key";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const keys = await prisma.apiKey.findMany({
      select: { id: true, name: true, keyPrefix: true, permissions: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(keys);
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, permissions } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const { raw, prefix, hash } = generateApiKey();

    await prisma.apiKey.create({
      data: { name, keyPrefix: prefix, keyHash: hash, permissions: permissions || "read" },
    });

    return NextResponse.json({ rawKey: raw, prefix, name, permissions: permissions || "read" }, { status: 201 });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.apiKey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}
