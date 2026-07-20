import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { processWelcomeSeries, processTagAutomation, processReEngagement } from "@/lib/cron/automation-processor";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, subscriberId, tagSlug } = body;

    switch (action) {
      case "welcome_series": {
        if (!subscriberId) {
          return NextResponse.json({ error: "subscriberId required" }, { status: 400 });
        }
        await processWelcomeSeries(subscriberId);
        return NextResponse.json({ message: "Welcome series triggered" });
      }

      case "tag_added": {
        if (!subscriberId || !tagSlug) {
          return NextResponse.json({ error: "subscriberId and tagSlug required" }, { status: 400 });
        }
        await processTagAutomation(subscriberId, tagSlug);
        return NextResponse.json({ message: "Tag automation triggered" });
      }

      case "re_engagement": {
        await processReEngagement();
        return NextResponse.json({ message: "Re-engagement check completed" });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to trigger automation:", error);
    return NextResponse.json({ error: "Failed to trigger automation" }, { status: 500 });
  }
}
