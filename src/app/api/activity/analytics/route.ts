import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getActivityAnalytics } from "@/lib/activity";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analytics = await getActivityAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Failed to fetch activity analytics:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
