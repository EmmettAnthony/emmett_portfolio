import { NextResponse } from "next/server";
import { getEmailDashboardStats } from "@/actions/email/analytics";

export async function GET() {
  try {
    const stats = await getEmailDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch email dashboard stats:", error);
    return NextResponse.json(
      {
        totalSubscribers: 0,
        activeSubscribers: 0,
        totalContacts: 0,
        transactionalEmailsSent: 0,
        totalCampaigns: 0,
        emailsSent: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        spamRate: 0,
        totalUnsubscribes: 0,
        recentActivity: [],
      },
      { status: 200 }
    );
  }
}
