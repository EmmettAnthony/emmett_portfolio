import { NextRequest, NextResponse } from "next/server";
import { getEmailAnalytics } from "@/actions/email/analytics";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const analytics = await getEmailAnalytics(dateFrom, dateTo);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Failed to fetch email analytics:", error);
    return NextResponse.json(
      {
        dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
        aggregated: {
          sent: 0, delivered: 0, opened: 0, clicked: 0,
          softBounce: 0, hardBounce: 0, spam: 0, unsubscribed: 0,
          openRate: 0, clickRate: 0, bounceRate: 0, spamRate: 0,
          unsubscribeRate: 0, deliveredRate: 0,
        },
        dailyStats: [],
        campaignPerformance: [],
        subscriberGrowth: [],
        topCountries: [],
        topSources: [],
        devices: [],
        browsers: [],
      },
      { status: 200 }
    );
  }
}
