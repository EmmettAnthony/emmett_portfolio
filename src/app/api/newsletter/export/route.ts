import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const where: Prisma.SubscriberWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status as Prisma.EnumSubscriberStatusFilter["equals"];
    if (source) where.source = source;

    const subscribers = await prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Country",
      "Tags",
      "Source",
      "Status",
      "Subscribed Date",
    ];

    const csvRows = subscribers.map((sub) => [
      escapeCsv(sub.firstName),
      escapeCsv(sub.lastName),
      escapeCsv(sub.email),
      escapeCsv(sub.phone ?? ""),
      escapeCsv(sub.company ?? ""),
      escapeCsv(sub.country ?? ""),
      escapeCsv(sub.tags ?? ""),
      escapeCsv(sub.source ?? ""),
      sub.status,
      sub.subscribedAt.toISOString().split("T")[0],
    ]);

    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

    // Log the export activity
    await logActivity({
      action: "export",
      module: "newsletter",
      description: `Exported ${subscribers.length} subscribers`,
      entity: "Subscriber",
      severity: "INFO",
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="subscribers.csv"',
      },
    });
  } catch (error) {
    console.error("Failed to export subscribers:", error);
    return NextResponse.json({ error: "Failed to export subscribers" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
