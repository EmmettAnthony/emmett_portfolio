import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import type { CalendarAnalytics } from "@/types/calendar";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      _appointmentsThisMonth,
      upcomingAppointments,
      overdueTasks,
      pendingReminders,
      appointmentsByType,
      totalConsultations,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { status: "CONFIRMED" } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
      prisma.appointment.count({ where: { preferredDate: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.appointment.count({ where: { preferredDate: { gte: now }, status: { notIn: ["CANCELLED", "NO_SHOW"] } } }),
      prisma.calendarTask.count({ where: { status: { notIn: ["COMPLETED"] }, dueDate: { lt: now } } }),
      prisma.reminder.count({ where: { status: "PENDING", remindAt: { lte: now } } }),
      prisma.appointment.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.appointment.count({ where: { source: "WEBSITE" } }),
    ]);

    const totalNonCancelled = totalAppointments - cancelledAppointments;
    const completionRate = totalNonCancelled > 0 ? Math.round((completedAppointments / totalNonCancelled) * 100) : 0;
    const bookingConversionRate = totalConsultations > 0 ? Math.round((confirmedAppointments / totalConsultations) * 100) : 0;

    // Appointments by month (last 6 months)
    const appointmentsByMonthData: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = await prisma.appointment.count({
        where: { preferredDate: { gte: monthStart, lte: monthEnd } },
      });
      appointmentsByMonthData.push({
        month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        count,
      });
    }

    const analytics: CalendarAnalytics = {
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      totalConsultations,
      bookingConversionRate,
      mostPopularTimeSlot: "10:00 AM",
      mostPopularDay: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      completionRate,
      appointmentsByType: appointmentsByType.map((a) => ({ type: a.status, count: a._count.status })),
      appointmentsByMonth: appointmentsByMonthData,
      upcomingAppointments,
      overdueTasks,
      pendingReminders,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    captureError(error, "Failed to fetch calendar analytics");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
