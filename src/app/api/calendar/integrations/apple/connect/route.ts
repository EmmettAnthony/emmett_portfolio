import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { testConnection, storeCredentials } from "@/lib/calendar/apple";
import { captureError } from "@/lib/sentry";

/**
 * Connect Apple iCloud Calendar by verifying CalDAV credentials.
 * Apple uses app-specific passwords instead of OAuth.
 *
 * Expects JSON body: { appleId: string, appPassword: string }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const { appleId, appPassword } = body as {
      appleId?: string;
      appPassword?: string;
    };

    if (!appleId || !appPassword) {
      return NextResponse.json(
        { error: "Apple ID and app-specific password are required" },
        { status: 400 }
      );
    }

    // Verify connectivity by discovering the user's calendar
    const { calendarUrl, calendarName } = await testConnection(appleId, appPassword);

    // Store the credentials
    const { id } = await storeCredentials(appleId, appPassword, calendarUrl, calendarName);

    return NextResponse.json({
      success: true,
      integrationId: id,
      email: appleId,
      calendarName,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to connect Apple Calendar";

    // If the error mentions authentication, return a helpful message
    if (message.includes("401") || message.includes("PROPFIND") || message.includes("principal")) {
      return NextResponse.json(
        {
          error: "Could not connect to iCloud. Verify your Apple ID and app-specific password are correct.",
          detail: message,
        },
        { status: 401 }
      );
    }

    captureError(error, "Apple Calendar connect failed");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
