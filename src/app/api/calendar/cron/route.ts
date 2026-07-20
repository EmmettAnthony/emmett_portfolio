import { NextResponse } from "next/server";
import { captureError } from "@/lib/sentry";
import { processPendingReminders, processAppointmentReminders } from "@/lib/cron/reminder-processor";

export const maxDuration = 300;

/**
 * Calendar cron endpoint - processes:
 * 1. Pending reminder notifications (email + dashboard)
 * 2. Appointment 24-hour reminders
 *
 * Protected by CRON_SECRET env variable.
 */
export async function GET(request: Request) {
  try {
    const authHeader = process.env.CRON_SECRET;
    if (authHeader) {
      const headerValue = request.headers.get("authorization");
      if (headerValue !== `Bearer ${authHeader}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const startTime = Date.now();

    const [reminderResult, appointmentResult] = await Promise.all([
      processPendingReminders(),
      processAppointmentReminders(),
    ]);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      reminders: {
        processed: reminderResult.processed,
        emailed: reminderResult.emailed,
        notified: reminderResult.notified,
        errors: reminderResult.errors.length,
      },
      appointmentReminders: {
        sent: appointmentResult.remindersSent,
        errors: appointmentResult.errors.length,
      },
      errorDetails: [
        ...reminderResult.errors,
        ...appointmentResult.errors,
      ],
    });
  } catch (error) {
    captureError(error, "Calendar cron processing failed");
    return NextResponse.json(
      { error: "Processing failed", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
