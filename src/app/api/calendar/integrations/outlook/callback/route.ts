import { NextResponse } from "next/server";
import { handleCallback } from "@/lib/calendar/outlook";
import { captureError } from "@/lib/sentry";

/**
 * Handle the OAuth callback from Microsoft after user authorization.
 * Exchanges the code for tokens and stores them, then redirects to settings.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("Outlook OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL("/dashboard/calendar/settings?integration=outlook&error=access_denied", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar/settings?integration=outlook&error=no_code", request.url)
      );
    }

    await handleCallback(code);

    return NextResponse.redirect(
      new URL("/dashboard/calendar/settings?integration=outlook&success=true", request.url)
    );
  } catch (error) {
    captureError(error, "Outlook Calendar OAuth callback failed");
    return NextResponse.redirect(
      new URL("/dashboard/calendar/settings?integration=outlook&error=callback_failed", request.url)
    );
  }
}
