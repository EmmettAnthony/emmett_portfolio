import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getSecurityEvents, createSecurityEvent, resolveSecurityEvent } from "@/lib/activity";
import { securityEventFilterSchema, createSecurityEventSchema } from "@/lib/validations/activity";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters = securityEventFilterSchema.parse(Object.fromEntries(searchParams.entries()));

    const result = await getSecurityEvents({
      eventType: filters.eventType,
      severity: filters.severity,
      resolved: filters.resolved,
      userId: filters.userId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch security events:", error);
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
    const parsed = createSecurityEventSchema.parse(body) as any;
    const event = await createSecurityEvent({
      eventType: parsed.eventType,
      description: parsed.description,
      severity: parsed.severity || "WARNING",
      userId: parsed.userId || (session.user.id as string),
      ipAddress: parsed.ipAddress || undefined,
      userAgent: parsed.userAgent || undefined,
      metadata: parsed.metadata || undefined,
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Failed to create security event:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, resolved } = body;

    if (id && resolved) {
      await resolveSecurityEvent(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "id and resolved required" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update security event:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
