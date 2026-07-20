import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { createTagSchema } from "@/lib/validations/newsletter";
import type { Prisma } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const tag = await prisma.tag.create({ data: parsed.data as Prisma.TagCreateInput });
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
