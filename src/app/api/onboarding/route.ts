import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

/**
 * GET /api/onboarding
 * Returns whether the current user has completed onboarding.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    });

    return NextResponse.json({
      completed: user?.onboardingCompleted ?? false,
    });
  } catch (error) {
    console.error("Failed to check onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding
 * Mark onboarding as completed for the current user.
 */
export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = getPrisma();
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}
