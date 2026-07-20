import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getActivityLogs } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const moduleFilter = searchParams.get("module") || undefined;
    const action = searchParams.get("action") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const result = await getActivityLogs({
      module: moduleFilter,
      action,
      severity,
      startDate,
      endDate,
      limit: 10000, // export up to 10k rows
    });

    if (format === "csv") {
      const headers = ["Timestamp", "Action", "Module", "Entity", "Entity ID", "Description", "Severity", "User", "IP Address", "Browser", "OS", "Device"];
      const rows = result.logs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.action,
        log.module,
        log.entity || "",
        log.entityId || "",
        `"${(log.description || "").replace(/"/g, '""')}"`,
        log.severity,
        log.user ? `"${(log.user.name || log.user.email || "").replace(/"/g, '""')}"` : "System",
        log.ip || "",
        log.browser || "",
        log.os || "",
        log.device || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="activity-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to export activity logs:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
