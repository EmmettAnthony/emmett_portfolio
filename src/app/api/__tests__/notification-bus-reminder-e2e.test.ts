// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Booking Reminder Empty-String Guard Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests that POST /api/booking/reminders skips appointments with null or empty
// email addresses when sending reminder emails.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ─────────────────────────────────────────────────────────

const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));
const mockAppointmentFindMany = vi.hoisted(() => vi.fn());
const mockAppointmentUpdate = vi.hoisted(() => vi.fn());
const mockContactEmailLogCreate = vi.hoisted(() => vi.fn());
const mockAppointmentCount = vi.hoisted(() => vi.fn());
const mockContactEmailLogCount = vi.hoisted(() => vi.fn());
const mockContactEmailLogFindMany = vi.hoisted(() => vi.fn());

// ─── Module-level mocks ───────────────────────────────────────────────────

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({ emails: { send: mockEmailSend } })),
}));

vi.mock("@/lib/db", () => {
  const prismaObj = {
    appointment: {
      findMany: (...args: unknown[]) => mockAppointmentFindMany(...args),
      update: (...args: unknown[]) => mockAppointmentUpdate(...args),
      count: (...args: unknown[]) => mockAppointmentCount(...args),
    },
    contactEmailLog: {
      create: (...args: unknown[]) => mockContactEmailLogCreate(...args),
      count: (...args: unknown[]) => mockContactEmailLogCount(...args),
      findMany: (...args: unknown[]) => mockContactEmailLogFindMany(...args),
    },
  };
  return { getPrisma: vi.fn(() => prismaObj), prisma: prismaObj };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────

const APPOINTMENT_WITH_EMAIL = {
  id: "apt-rem-1",
  name: "Alice Smith",
  email: "alice@example.com",
  preferredDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
  preferredTime: "10:00",
  duration: 30,
  reminderSent: false,
};

const APPOINTMENT_NULL_EMAIL = {
  ...APPOINTMENT_WITH_EMAIL,
  id: "apt-rem-2",
  name: "Bob Jones",
  email: null,
};

const APPOINTMENT_EMPTY_EMAIL = {
  ...APPOINTMENT_WITH_EMAIL,
  id: "apt-rem-3",
  name: "Carol White",
  email: "",
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "test-key";

  mockAppointmentCount.mockResolvedValue(0);
  mockContactEmailLogCount.mockResolvedValue(0);
  mockContactEmailLogFindMany.mockResolvedValue([]);
  mockAppointmentUpdate.mockResolvedValue({});
  mockContactEmailLogCreate.mockResolvedValue({});
});

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("Booking Reminder Empty-String Guard: POST /api/booking/reminders", () => {
  it("sends reminder email when appointment has a valid email", async () => {
    mockAppointmentFindMany.mockResolvedValue([APPOINTMENT_WITH_EMAIL]);

    const { POST } = await import("@/app/api/booking/reminders/route");

    const response = await POST();

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.sent).toBe(1);
    expect(data.errors).toBe(0);

    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["alice@example.com"],
        subject: expect.stringContaining("Reminder"),
      })
    );
  });

  it("skips appointment with null email and does NOT send reminder", async () => {
    mockAppointmentFindMany.mockResolvedValue([
      APPOINTMENT_WITH_EMAIL,
      APPOINTMENT_NULL_EMAIL,
    ]);

    const { POST } = await import("@/app/api/booking/reminders/route");

    const response = await POST();

    const data = await response.json();
    expect(response.status).toBe(200);
    // Only the valid-email appointment should be processed
    expect(data.sent).toBe(1);
    expect(data.errors).toBe(0);

    // Only one email sent (for the valid appointment)
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["alice@example.com"],
      })
    );
  });

  it("skips appointment with empty-string email and does NOT send reminder", async () => {
    mockAppointmentFindMany.mockResolvedValue([
      APPOINTMENT_WITH_EMAIL,
      APPOINTMENT_EMPTY_EMAIL,
    ]);

    const { POST } = await import("@/app/api/booking/reminders/route");

    const response = await POST();

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.sent).toBe(1);
    expect(data.errors).toBe(0);

    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["alice@example.com"],
      })
    );
  });

  it("does NOT send any emails when all appointments have null/empty email", async () => {
    mockAppointmentFindMany.mockResolvedValue([
      APPOINTMENT_NULL_EMAIL,
      APPOINTMENT_EMPTY_EMAIL,
    ]);

    const { POST } = await import("@/app/api/booking/reminders/route");

    const response = await POST();

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.sent).toBe(0);
    expect(data.errors).toBe(0);

    expect(mockEmailSend).not.toHaveBeenCalled();
  });
});
