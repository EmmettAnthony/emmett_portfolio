import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/calendar/google";

/**
 * Redirect the user to Google's OAuth consent screen.
 */
export async function GET() {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "OAuth initialization failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
