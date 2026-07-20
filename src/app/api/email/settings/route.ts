import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({}, { status: 200 });

    let settings = await prisma.emailSetting.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await prisma.emailSetting.create({
        data: { id: "global" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch email settings:", error);
    return NextResponse.json({}, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const settings = await prisma.emailSetting.upsert({
      where: { id: "global" },
      create: { id: "global", ...data },
      update: data,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update email settings:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
