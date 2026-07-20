import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import {
  DEFAULT_OPTIONS
} from "@/lib/form-field-options";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.siteSettings.findFirst({ where: { id: "global" } });
    if (!settings?.formFieldOptions) {
      return NextResponse.json(DEFAULT_OPTIONS);
    }

    return NextResponse.json(settings.formFieldOptions);
  } catch (error) {
    console.error("Failed to fetch form field options:", error);
    return NextResponse.json(DEFAULT_OPTIONS);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Validate structure
    if (!body.projectTypes || !body.budgetRanges || !body.timelineOptions) {
      return NextResponse.json(
        { error: "Missing required fields: projectTypes, budgetRanges, timelineOptions" },
        { status: 400 }
      );
    }

    for (const key of ["projectTypes", "budgetRanges", "timelineOptions"] as const) {
      if (!Array.isArray(body[key])) {
        return NextResponse.json({ error: `${key} must be an array` }, { status: 400 });
      }
      for (const item of body[key]) {
        if (!item.value || !item.label) {
          return NextResponse.json(
            { error: `Each item in ${key} must have a value and label` },
            { status: 400 }
          );
        }
      }
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: "global" },
      create: {
        id: "global",
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        formFieldOptions: body as any,
      },
      update: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        formFieldOptions: body as any,
      },
    });

    return NextResponse.json(settings.formFieldOptions);
  } catch (error) {
    console.error("Failed to update form field options:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
