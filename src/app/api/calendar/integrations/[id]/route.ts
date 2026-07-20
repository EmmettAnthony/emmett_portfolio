import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";

/**
 * Get a single integration's details.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const integration = await prisma.calendarIntegration.findUnique({ where: { id } });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: integration.id,
      provider: integration.provider,
      email: integration.email,
      calendarName: integration.calendarName,
      syncEnabled: integration.syncEnabled,
      syncDirection: integration.syncDirection,
      lastSyncedAt: integration.lastSyncedAt?.toISOString() || null,
    });
  } catch (error) {
    captureError(error, "Failed to fetch integration");
    return NextResponse.json({ error: "Failed to fetch integration" }, { status: 500 });
  }
}

/**
 * Disconnect/delete an integration or toggle sync settings.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.calendarIntegration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    captureError(error, "Failed to disconnect integration");
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}

/**
 * Toggle sync on/off for an integration.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const prisma = getPrisma();

    const integration = await prisma.calendarIntegration.update({
      where: { id },
      data: {
        syncEnabled: body.syncEnabled !== undefined ? body.syncEnabled : undefined,
      },
    });

    return NextResponse.json({
      id: integration.id,
      syncEnabled: integration.syncEnabled,
    });
  } catch (error) {
    captureError(error, "Failed to update integration");
    return NextResponse.json({ error: "Failed to update integration" }, { status: 500 });
  }
}
