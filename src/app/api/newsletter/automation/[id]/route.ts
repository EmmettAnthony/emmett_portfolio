import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { updateAutomationSchema } from "@/lib/validations/newsletter";
import type { Prisma } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const automation = await prisma.automation.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        campaign: true,
      },
    });

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    return NextResponse.json({ automation });
  } catch (error) {
    console.error("Failed to fetch automation:", error);
    return NextResponse.json({ error: "Failed to fetch automation" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const automation = await prisma.automation.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ automation });
  } catch (error) {
    console.error("Failed to patch automation:", error);
    return NextResponse.json({ error: "Failed to update automation" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateAutomationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = await prisma.automation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    const automation = await prisma.automation.update({
      where: { id },
      data: parsed.data as Prisma.AutomationUpdateInput,
    });

    return NextResponse.json({ automation });
  } catch (error) {
    console.error("Failed to update automation:", error);
    return NextResponse.json({ error: "Failed to update automation" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.automation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete automation:", error);
    return NextResponse.json({ error: "Failed to delete automation" }, { status: 500 });
  }
}
