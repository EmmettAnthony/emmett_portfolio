import { NextResponse } from "next/server";
import { handleCallback } from "@/lib/calendar/google";
import { captureError } from "@/lib/sentry";

/**
 * Handle the OAuth callback from Google after user authorization.
 * Exchanges the code for tokens and stores them, then redirects to settings.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL("/dashboard/calendar/settings?integration=google&error=access_denied", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar/settings?integration=google&error=no_code", request.url)
      );
    }

    await handleCallback(code);

    return NextResponse.redirect(
      new URL("/dashboard/calendar/settings?integration=google&success=true", request.url)
    );
  } catch (error) {
    captureError(error, "Google Calendar OAuth callback failed");
    return NextResponse.redirect(
      new URL("/dashboard/calendar/settings?integration=google&error=callback_failed", request.url)
    );
  }
}
