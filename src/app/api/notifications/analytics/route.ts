import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getNotificationAnalytics } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const analytics = await getNotificationAnalytics(startDate, endDate);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Failed to fetch notification analytics:", error);
    return NextResponse.json({ error: "Failed to fetch notification analytics" }, { status: 500 });
  }
}
