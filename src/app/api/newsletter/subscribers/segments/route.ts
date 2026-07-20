import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { createSegmentSchema } from "@/lib/validations/newsletter";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: "desc" },
      include: { tags: true },
    });
    return NextResponse.json(segments);
  } catch (error) {
    console.error("Failed to fetch segments:", error);
    return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createSegmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { tagIds, ...data } = parsed.data;

    const segment = await prisma.segment.create({
      data: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        ...data as any,
        tags: tagIds?.length ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { tags: true },
    });

    return NextResponse.json({ segment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create segment:", error);
    return NextResponse.json({ error: "Failed to create segment" }, { status: 500 });
  }
}
