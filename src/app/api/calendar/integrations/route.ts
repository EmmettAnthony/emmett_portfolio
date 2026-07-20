import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { getIntegrationStatus as getGoogleIntegrationStatus, getAuthUrl as getGoogleAuthUrl } from "@/lib/calendar/google";
import { getIntegrationStatus as getOutlookIntegrationStatus, getAuthUrl as getOutlookAuthUrl } from "@/lib/calendar/outlook";
import { getIntegrationStatus as getAppleIntegrationStatus } from "@/lib/calendar/apple";

/**
 * Safely attempt to get the auth URL for a provider, returning null if
 * the OAuth credentials are not configured (or any other error occurs).
 */
function safeGetAuthUrl(getter: () => string): string | null {
  try {
    return getter();
  } catch {
    return null;
  }
}

/**
 * List all calendar integrations and their statuses.
 */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    const integrations = await prisma.calendarIntegration.findMany({
      orderBy: { createdAt: "desc" },
    });

    const [googleStatus, outlookStatus, appleStatus] = await Promise.all([
      getGoogleIntegrationStatus(),
      getOutlookIntegrationStatus(),
      getAppleIntegrationStatus(),
    ]);

    return NextResponse.json({
      integrations: integrations.map((i) => ({
        id: i.id,
        provider: i.provider,
        email: i.email,
        calendarName: i.calendarName,
        syncEnabled: i.syncEnabled,
        syncDirection: i.syncDirection,
        lastSyncedAt: i.lastSyncedAt?.toISOString() || null,
      })),
      google: googleStatus,
      outlook: outlookStatus,
      apple: appleStatus,
      authUrl: !googleStatus.connected ? safeGetAuthUrl(getGoogleAuthUrl) : null,
      outlookAuthUrl: !outlookStatus.connected ? safeGetAuthUrl(getOutlookAuthUrl) : null,
    });
  } catch (error) {
    captureError(error, "Failed to fetch integrations");
    return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
  }
}

/**
 * Initiate a provider connection by returning the auth URL.
 * Expects a JSON body: { provider: "GOOGLE" | "OUTLOOK" }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const provider = (body?.provider as string)?.toUpperCase();

    if (provider === "OUTLOOK") {
      const authUrl = getOutlookAuthUrl();
      return NextResponse.json({ authUrl, provider: "OUTLOOK" });
    }

    // Default to Google
    const authUrl = getGoogleAuthUrl();
    return NextResponse.json({ authUrl, provider: "GOOGLE" });
  } catch (error) {
    captureError(error, "Failed to initiate calendar connection");
    return NextResponse.json({ error: "Failed to initiate connection" }, { status: 500 });
  }
}
