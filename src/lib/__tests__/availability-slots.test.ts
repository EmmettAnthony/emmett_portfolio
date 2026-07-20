import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    availability: { findUnique: mockFindUnique },
    dateException: { findFirst: mockFindFirst },
    appointment: { findMany: mockFindMany },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockAvail(overrides: Record<string, unknown> = {}) {
  return {
    id: "avail-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    dayOfWeek: 2,
    isActive: true,
    startTime: "09:00",
    endTime: "17:00",
    breakStart: null,
    breakEnd: null,
    slotDuration: 30,
    ...overrides,
  };
}

function mockAppt(time: string, duration: number) {
  return { preferredTime: time, duration };
}

describe("getAvailableSlots", () => {
  it("returns empty when no availability config exists", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots).toEqual([]);
  });

  it("returns empty when availability is inactive", async () => {
    mockFindUnique.mockResolvedValue(mockAvail({ isActive: false }));

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots).toEqual([]);
  });

  it("returns empty when date is blocked by exception", async () => {
    mockFindUnique.mockResolvedValue(mockAvail());
    mockFindFirst.mockResolvedValue({ id: "exc-1", date: new Date("2026-07-08"), isAvailable: false });
    mockFindMany.mockResolvedValue([]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots).toEqual([]);
  });

  it("generates slots for a full day", async () => {
    mockFindUnique.mockResolvedValue(mockAvail());
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots).toHaveLength(16);
    expect(slots[0]).toEqual({ time: "09:00", available: true });
    expect(slots[slots.length - 1]).toEqual({ time: "16:30", available: true });
  });

  it("skips slots during break period", async () => {
    mockFindUnique.mockResolvedValue(mockAvail({ breakStart: "12:00", breakEnd: "13:00" }));
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots.find((s) => s.time === "12:00")).toBeUndefined();
    expect(slots.find((s) => s.time === "12:30")).toBeUndefined();
    expect(slots.find((s) => s.time === "11:30")).toBeDefined();
    expect(slots.find((s) => s.time === "13:00")).toBeDefined();
    expect(slots.length).toBe(14);
  });

  it("marks slots as unavailable when overlapping with existing appointments", async () => {
    mockFindUnique.mockResolvedValue(mockAvail());
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([mockAppt("10:00", 60)]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots.find((s) => s.time === "10:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "10:30")?.available).toBe(false);
    expect(slots.find((s) => s.time === "09:00")?.available).toBe(true);
    expect(slots.find((s) => s.time === "11:00")?.available).toBe(true);
  });

  it("handles partial hours with custom start/end", async () => {
    mockFindUnique.mockResolvedValue(mockAvail({ startTime: "10:00", endTime: "12:00" }));
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots).toHaveLength(4);
    expect(slots[0].time).toBe("10:00");
    expect(slots[slots.length - 1].time).toBe("11:30");
  });

  it("handles 60-minute duration", async () => {
    mockFindUnique.mockResolvedValue(mockAvail({ startTime: "09:00", endTime: "12:00" }));
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"), 60);

    expect(slots).toHaveLength(5);
    expect(slots[0].time).toBe("09:00");
    expect(slots[1].time).toBe("09:30");
    expect(slots[2].time).toBe("10:00");
    expect(slots[3].time).toBe("10:30");
    expect(slots[4].time).toBe("11:00");
  });

  it("handles appointment with null preferredTime", async () => {
    mockFindUnique.mockResolvedValue(mockAvail({ startTime: "09:00", endTime: "11:00" }));
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([{ preferredTime: null, duration: 30 }]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("break start at boundary - slot starting exactly at break end is included", async () => {
    mockFindUnique.mockResolvedValue(mockAvail({ startTime: "09:00", endTime: "14:00", breakStart: "12:00", breakEnd: "13:00" }));
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots.find((s) => s.time === "13:00")).toBeDefined();
    expect(slots.find((s) => s.time === "11:30")).toBeDefined();
  });

  it("break period covers entire morning - skips to afternoon", async () => {
    mockFindUnique.mockResolvedValue(mockAvail({ startTime: "09:00", endTime: "17:00", breakStart: "09:00", breakEnd: "13:00" }));
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"));

    expect(slots[0].time).toBe("13:00");
  });

  it("uses correct dayOfWeek for findUnique", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { getAvailableSlots } = await import("../availability/slots");
    await getAvailableSlots(new Date("2026-07-08"));

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { dayOfWeek: 3 } });
  });

  it("handles slot boundary where slot end exactly equals break start", async () => {
    mockFindUnique.mockResolvedValue(mockAvail({ startTime: "09:00", endTime: "12:30", breakStart: "12:00", breakEnd: "13:00", slotDuration: 30 }));
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getAvailableSlots } = await import("../availability/slots");
    const slots = await getAvailableSlots(new Date("2026-07-08"), 30);

    expect(slots.find((s) => s.time === "11:30")).toBeDefined();
    expect(slots.find((s) => s.time === "12:00")).toBeUndefined();
  });
});

describe("getNextAvailableDays", () => {
  it("skips weekends and returns available days with slots", async () => {
    const saturday = new Date("2026-07-04");
    const sunday = new Date("2026-07-05");

    mockFindUnique.mockResolvedValue(mockAvail());
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getNextAvailableDays } = await import("../availability/slots");
    const days = await getNextAvailableDays(3, 30);

    const dates = days.map((d) => d.date);
    expect(dates).not.toContain(saturday.toISOString().split("T")[0]);
    expect(dates).not.toContain(sunday.toISOString().split("T")[0]);
    expect(days.length).toBeGreaterThan(0);
  });

  it("returns empty array when no availability configured", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { getNextAvailableDays } = await import("../availability/slots");
    const days = await getNextAvailableDays(5, 30);

    expect(days).toEqual([]);
  });

  it("returns only days that have slots", async () => {
    mockFindUnique
      .mockResolvedValueOnce(mockAvail())
      .mockResolvedValueOnce(null);

    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getNextAvailableDays } = await import("../availability/slots");
    const days = await getNextAvailableDays(5, 30);

    for (const day of days) {
      expect(day.slots.length).toBeGreaterThan(0);
    }
  });

  it("includes dayOfWeek in returned days", async () => {
    mockFindUnique.mockResolvedValue(mockAvail());
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getNextAvailableDays } = await import("../availability/slots");
    const days = await getNextAvailableDays(1, 30);

    for (const day of days) {
      expect(day.dayOfWeek).toBeGreaterThanOrEqual(1);
      expect(day.dayOfWeek).toBeLessThanOrEqual(5);
    }
  });

  it("respects custom days parameter", async () => {
    mockFindUnique.mockResolvedValue(mockAvail());
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([]);

    const { getNextAvailableDays } = await import("../availability/slots");
    const days = await getNextAvailableDays(14, 30);

    expect(days.length).toBeLessThanOrEqual(10);
  });
});
