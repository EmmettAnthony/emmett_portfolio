import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { createAutomationSchema } from "@/lib/validations/newsletter";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.AutomationWhereInput = {};
    if (status) where.status = status;

    const automations = await prisma.automation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        campaign: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Failed to fetch automations:", error);
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { steps: stepData, ...automationBody } = body;
    const parsed = createAutomationSchema.safeParse(automationBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { campaignId, ...rest } = parsed.data;
    const createData = {
      ...rest,
      ...(campaignId ? { campaignId } : {}),
    };

    const automation = await prisma.automation.create({
      data: {
        ...createData as Prisma.AutomationCreateInput,
        steps: stepData?.length
          ? { create: stepData.map((s: Record<string, unknown>) => ({
              stepOrder: s.stepOrder as number,
              name: s.name as string,
              subject: (s.subject as string) || null,
              content: (s.content as string) || null,
              delayDays: (s.delayDays as number) || 0,
              delayHours: (s.delayHours as number) || 0,
              condition: s.condition as Prisma.InputJsonValue,
            })) }
          : undefined,
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    return NextResponse.json({ automation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create automation:", error);
    return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
  }
}
