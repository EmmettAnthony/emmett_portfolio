import { getPrisma } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { appointmentReminderTemplate, customReminderTemplate } from "@/lib/email/templates";

const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev";

/**
 * Process all pending reminders that are due.
 * - Queries reminders where remindAt <= now and status = "PENDING"
 * - Sends email for EMAIL and BOTH remindTypes
 * - Creates dashboard notifications for DASHBOARD and BOTH
 * - Marks them as SENT
 * - Handles repeat intervals by creating next reminder
 */
export async function processPendingReminders(): Promise<{
  processed: number;
  emailed: number;
  notified: number;
  errors: string[];
}> {
  const prisma = getPrisma();
  const now = new Date();
  let processed = 0;
  let emailed = 0;
  let notified = 0;
  const errors: string[] = [];

  try {
    const pending = await prisma.reminder.findMany({
      where: {
        status: "PENDING",
        remindAt: { lte: now },
      },
      include: {
        events: {
          where: { eventType: "REMINDER" },
          take: 1,
        },
      },
    });

    for (const reminder of pending) {
      try {
        const remindType = reminder.remindType || "DASHBOARD";

        // Send email for EMAIL and BOTH types
        if (remindType === "EMAIL" || remindType === "BOTH") {
          try {
            const resend = getResend();
            const template = customReminderTemplate({
              title: reminder.title,
              description: reminder.description,
              remindAt: reminder.remindAt,
              relatedType: reminder.relatedType,
            });
            await resend.emails.send({
              from: `Emmett Anthony <${SENDER_EMAIL}>`,
              to: process.env.SENDER_EMAIL || "emmettanthony998@gmail.com",
              subject: template.subject,
              html: template.html,
            });
            emailed++;
          } catch (emailErr) {
            console.error(`Failed to send reminder email ${reminder.id}:`, emailErr);
            errors.push(`Email failed for reminder ${reminder.id}: ${emailErr instanceof Error ? emailErr.message : "Unknown"}`);
          }
        }

        // Create dashboard notification for BOTH and DASHBOARD types
        if (remindType === "DASHBOARD" || remindType === "BOTH") {
          try {
            await prisma.notification.create({
              data: {
                category: "SYSTEM",
                priority: "MEDIUM",
                notifType: "INFO",
                title: reminder.title,
                message: reminder.description || `Reminder: ${reminder.title}`,
                link: reminder.relatedId ? `/dashboard/calendar/${reminder.relatedType?.toLowerCase() || "reminders"}` : "/dashboard/calendar/reminders",
                key: `reminder-${reminder.id}`,
                source: "calendar",
              },
            });
            notified++;
          } catch (notifErr) {
            console.error(`Failed to create notification for reminder ${reminder.id}:`, notifErr);
          }
        }

        // Handle repeat intervals
        if (reminder.repeatInterval) {
          const nextRemindAt = calculateNextRepeat(reminder.remindAt, reminder.repeatInterval);
          const repeatUntil = reminder.repeatUntil;

          if (!repeatUntil || nextRemindAt <= repeatUntil) {
            await prisma.reminder.create({
              data: {
                title: reminder.title,
                description: reminder.description,
                remindAt: nextRemindAt,
                remindType: reminder.remindType,
                status: "PENDING",
                relatedType: reminder.relatedType,
                relatedId: reminder.relatedId,
                repeatInterval: reminder.repeatInterval,
                repeatUntil: reminder.repeatUntil,
              },
            });

            // Create calendar event for the next occurrence
            await prisma.calendarEvent.create({
              data: {
                title: `Reminder: ${reminder.title}`,
                description: reminder.description,
                startDate: nextRemindAt,
                allDay: false,
                eventType: "REMINDER",
                status: "SCHEDULED",
                color: "#f59e0b",
              },
            });
          }
        }

        // Mark current reminder as sent
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "SENT", sentAt: now },
        });

        // Update the associated calendar event status
        if (reminder.events.length > 0) {
          await prisma.calendarEvent.update({
            where: { id: reminder.events[0].id },
            data: { status: "COMPLETED" },
          });
        }

        processed++;
      } catch (err) {
        const msg = `Error processing reminder ${reminder.id}: ${err instanceof Error ? err.message : "Unknown"}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    return { processed, emailed, notified, errors };
  } catch (error) {
    console.error("Failed to process reminders:", error);
    return { processed: 0, emailed: 0, notified: 0, errors: [error instanceof Error ? error.message : "Unknown error"] };
  }
}

/**
 * Calculate the next reminder date based on repeat interval
 */
function calculateNextRepeat(from: Date, interval: string): Date {
  const next = new Date(from);
  switch (interval) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Process and send appointment reminders for upcoming appointments.
 * Sends reminders 24 hours before the appointment if not already sent.
 */
export async function processAppointmentReminders(): Promise<{
  remindersSent: number;
  errors: string[];
}> {
  const prisma = getPrisma();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let remindersSent = 0;
  const errors: string[] = [];

  try {
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        reminderSent: false,
        preferredDate: {
          gte: new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000), // within 2 hour window of "tomorrow"
          lte: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        },
      },
      include: { meetingType: true },
    });

    for (const appointment of upcomingAppointments) {
      try {
        const resend = getResend();
        const template = appointmentReminderTemplate({
          name: appointment.name,
          date: appointment.preferredDate,
          time: appointment.preferredTime,
          duration: appointment.duration,
          meetingType: appointment.meetingType?.name,
          timezone: appointment.timezone,
        });

        await resend.emails.send({
          from: `Emmett Anthony <${SENDER_EMAIL}>`,
          to: appointment.email,
          subject: template.subject,
          html: template.html,
        });

        // Mark reminder as sent
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true },
        });

        // Log the activity
        await prisma.appointmentLog.create({
          data: {
            appointmentId: appointment.id,
            action: "REMINDER_SENT",
            detail: "24-hour reminder email sent",
          },
        });

        remindersSent++;
      } catch (err) {
        const msg = `Failed to send appointment reminder for ${appointment.id}: ${err instanceof Error ? err.message : "Unknown"}`;
        errors.push(msg);
      }
    }

    return { remindersSent, errors };
  } catch (error) {
    console.error("Failed to process appointment reminders:", error);
    return { remindersSent: 0, errors: [error instanceof Error ? error.message : "Unknown error"] };
  }
}
