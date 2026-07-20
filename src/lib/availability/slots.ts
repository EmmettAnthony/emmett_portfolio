import { prisma } from "@/lib/db";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailableDay {
  date: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

export async function getAvailableSlots(
  date: Date,
  duration: number = 30
): Promise<TimeSlot[]> {
  const dayOfWeek = date.getDay();

  const availability = await prisma.availability.findUnique({
    where: { dayOfWeek },
  });

  if (!availability || !availability.isActive) return [];

  const dateStr = date.toISOString().split("T")[0];

  const exception = await prisma.dateException.findFirst({
    where: {
      date: new Date(dateStr),
      isAvailable: false,
    },
  });
  if (exception) return [];

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      preferredDate: new Date(dateStr),
      status: { notIn: ["CANCELLED"] },
    },
    select: { preferredTime: true, duration: true },
  });

  const slots: TimeSlot[] = [];
  const [startH, startM] = availability.startTime.split(":").map(Number);
  const [endH, endM] = availability.endTime.split(":").map(Number);

  const breakStart = availability.breakStart?.split(":").map(Number);
  const breakEnd = availability.breakEnd?.split(":").map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  const slotSize = availability.slotDuration;

  while (current + duration <= end) {
    const slotEnd = current + duration;

    if (breakStart && breakEnd) {
      const bStart = breakStart[0] * 60 + breakStart[1];
      const bEnd = breakEnd[0] * 60 + breakEnd[1];
      if (current < bEnd && slotEnd > bStart) {
        current = Math.max(current + slotSize, bEnd);
        continue;
      }
    }

    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    const isBooked = existingAppointments.some((apt) => {
      if (!apt.preferredTime) return false;
      const [aH, aM] = apt.preferredTime.split(":").map(Number);
      const aStart = aH * 60 + aM;
      const aEnd = aStart + apt.duration;
      return current < aEnd && slotEnd > aStart;
    });

    slots.push({ time: timeStr, available: !isBooked });
    current += slotSize;
  }

  return slots;
}

export async function getNextAvailableDays(
  days: number = 14,
  duration: number = 30
): Promise<AvailableDay[]> {
  const result: AvailableDay[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const slots = await getAvailableSlots(date, duration);
    if (slots.length > 0) {
      result.push({
        date: date.toISOString().split("T")[0],
        dayOfWeek: date.getDay(),
        slots,
      });
    }
  }

  return result;
}