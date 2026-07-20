import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET() {
  const settings = await prisma.supportSetting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return NextResponse.json({ settings: map });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const updates: { key: string; value: unknown }[] = [];
  for (const [key, value] of Object.entries(body)) {
    updates.push({ key, value });
  }
  for (const u of updates) {
    await prisma.supportSetting.upsert({
      where: { key: u.key },
      update: { value: u.value as Prisma.InputJsonValue },
      create: { key: u.key, value: u.value as Prisma.InputJsonValue },
    });
  }
  return NextResponse.json({ success: true });
}
