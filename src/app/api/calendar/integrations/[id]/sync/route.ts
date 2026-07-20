import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import { fullExportSync as googleFullExportSync } from "@/lib/calendar/google";
import { fullExportSync as outlookFullExportSync } from "@/lib/calendar/outlook";
import { fullExportSync as appleFullExportSync } from "@/lib/calendar/apple";

/**
 * Trigger a full manual sync to a calendar integration.
 * Dispatches to the correct provider based on the integration record.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const prisma = getPrisma();

    // Fetch the integration to determine the provider
    const integration = await prisma.calendarIntegration.findUnique({
      where: { id },
      select: { provider: true },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Dispatch to the correct provider's sync function
    let result: { created: number; updated: number; failed: number };
    switch (integration.provider) {
      case "OUTLOOK":
        result = await outlookFullExportSync();
        break;
      case "APPLE":
        result = await appleFullExportSync();
        break;
      case "GOOGLE":
      default:
        result = await googleFullExportSync();
        break;
    }

    return NextResponse.json({
      success: true,
      integrationId: id,
      ...result,
    });
  } catch (error) {
    captureError(error, "Manual calendar sync failed");
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
