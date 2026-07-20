import { describe, it, expect, vi } from "vitest";

interface BookingInput {
  name: string;
  email: string;
  phone?: string;
  meetingTypeId: string;
  preferredDate: string;
  preferredTime: string;
  timezone: string;
  message?: string;
}

interface BookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
  calendarEvent?: { title: string; start: string; end: string };
}

interface AvailabilitySlot {
  date: string;
  slots: Array<{ time: string; available: boolean }>;
}

function getAvailableSlots(
  date: string,
  existingBookings: Array<{ date: string; time: string }>,
  workingHours: { start: string; end: string },
  slotDuration: number,
): AvailabilitySlot {
  const slots: Array<{ time: string; available: boolean }> = [];
  const [startH, startM] = workingHours.start.split(":").map(Number);
  const [endH, endM] = workingHours.end.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + slotDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const time = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

    const isBooked = existingBookings.some((b) => b.date === date && b.time === time);
    slots.push({ time, available: !isBooked });

    currentMinutes += slotDuration;
  }

  return { date, slots };
}

function hasTimeConflict(
  existingBookings: Array<{ date: string; time: string; duration: number }>,
  newBooking: { date: string; time: string; duration: number },
): boolean {
  const newStart = timeToMinutes(newBooking.time);
  const newEnd = newStart + newBooking.duration;

  return existingBookings.some((b) => {
    if (b.date !== newBooking.date) return false;
    const existingStart = timeToMinutes(b.time);
    const existingEnd = existingStart + b.duration;
    return newStart < existingEnd && existingStart < newEnd;
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function validateBookingInput(input: BookingInput): string[] {
  const errors: string[] = [];
  if (!input.name || input.name.trim().length < 2) errors.push("Name is required (min 2 characters)");
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.push("Valid email is required");
  if (!input.meetingTypeId) errors.push("Meeting type is required");
  if (!input.preferredDate) errors.push("Preferred date is required");
  if (!input.preferredTime) errors.push("Preferred time is required");
  if (!input.timezone) errors.push("Timezone is required");
  return errors;
}

describe("Booking Flow", () => {
  const validBooking: BookingInput = {
    name: "John Doe",
    email: "john@example.com",
    meetingTypeId: "mt-1",
    preferredDate: "2024-07-15",
    preferredTime: "10:00",
    timezone: "America/New_York",
  };

  describe("getAvailableSlots", () => {
    it("generates slots within working hours", () => {
      const result = getAvailableSlots("2024-07-15", [], { start: "09:00", end: "17:00" }, 30);
      expect(result.slots).toHaveLength(16);
      expect(result.slots[0].time).toBe("09:00");
      expect(result.slots[15].time).toBe("16:30");
    });

    it("marks booked slots as unavailable", () => {
      const result = getAvailableSlots(
        "2024-07-15",
        [{ date: "2024-07-15", time: "10:00" }, { date: "2024-07-15", time: "11:00" }],
        { start: "09:00", end: "17:00" },
        30,
      );
      expect(result.slots.find((s) => s.time === "10:00")?.available).toBe(false);
      expect(result.slots.find((s) => s.time === "11:00")?.available).toBe(false);
      expect(result.slots.find((s) => s.time === "10:30")?.available).toBe(true);
    });
  });

  describe("hasTimeConflict", () => {
    it("detects overlapping bookings", () => {
      const existing = [{ date: "2024-07-15", time: "10:00", duration: 30 }];
      expect(hasTimeConflict(existing, { date: "2024-07-15", time: "10:15", duration: 30 })).toBe(true);
    });

    it("allows back-to-back bookings", () => {
      const existing = [{ date: "2024-07-15", time: "10:00", duration: 30 }];
      expect(hasTimeConflict(existing, { date: "2024-07-15", time: "10:30", duration: 30 })).toBe(false);
    });

    it("allows different dates", () => {
      const existing = [{ date: "2024-07-15", time: "10:00", duration: 60 }];
      expect(hasTimeConflict(existing, { date: "2024-07-16", time: "10:00", duration: 60 })).toBe(false);
    });
  });

  describe("validateBookingInput", () => {
    it("passes valid input", () => {
      expect(validateBookingInput(validBooking)).toHaveLength(0);
    });

    it("rejects missing name", () => {
      const errors = validateBookingInput({ ...validBooking, name: "" });
      expect(errors.length).toBeGreaterThan(0);
    });

    it("rejects invalid email", () => {
      const errors = validateBookingInput({ ...validBooking, email: "bad" });
      expect(errors).toContain("Valid email is required");
    });

    it("rejects missing timezone", () => {
      const errors = validateBookingInput({ ...validBooking, timezone: "" });
      expect(errors).toContain("Timezone is required");
    });
  });
});
