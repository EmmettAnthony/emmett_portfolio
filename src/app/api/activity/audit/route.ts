import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getAuditTrails, createAuditTrail } from "@/lib/activity";
import { createAuditTrailSchema } from "@/lib/validations/activity";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const action = searchParams.get("action") || undefined;
    const page = parseInt(searchParams.get("page") || "1");

    const result = await getAuditTrails(entityType, entityId, action, page);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch audit trails:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = createAuditTrailSchema.parse(body) as any;
    const trail = await createAuditTrail({
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      action: parsed.action,
      field: parsed.field || undefined,
      beforeValue: parsed.beforeValue || undefined,
      afterValue: parsed.afterValue || undefined,
      beforeData: parsed.beforeData || undefined,
      afterData: parsed.afterData || undefined,
      userId: parsed.userId || (session.user.id as string),
      description: parsed.description || undefined,
    });
    return NextResponse.json(trail, { status: 201 });
  } catch (error) {
    console.error("Failed to create audit trail:", error);
    return NextResponse.json({ error: "Failed to create audit trail" }, { status: 500 });
  }
}
