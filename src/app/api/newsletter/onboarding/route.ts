import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const campaignCount = await prisma.campaign.count();
    return NextResponse.json({ shouldShow: campaignCount === 0 });
  } catch (error) {
    console.error("Failed to check onboarding status:", error);
    return NextResponse.json({ error: "Failed to check onboarding status" }, { status: 500 });
  }
}
