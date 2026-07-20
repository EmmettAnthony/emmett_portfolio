import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/calendar/outlook";

/**
 * Redirect the user to Microsoft's OAuth consent screen for Outlook Calendar.
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
