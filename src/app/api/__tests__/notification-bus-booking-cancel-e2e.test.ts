// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Booking Cancel Null-Guard End-to-End Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests that the POST /api/booking/[id]/cancel route handles null appointment
// email gracefully — no cancellation email is sent when email is missing.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ─────────────────────────────────────────────────────────

const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));
const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockAppointmentFindUnique = vi.hoisted(() => vi.fn());
const mockAppointmentUpdate = vi.hoisted(() => vi.fn());
const mockNotifCreate = vi.hoisted(() => vi.fn());
const mockNotifPrefFindUnique = vi.hoisted(() => vi.fn());
const mockNotifLogCreate = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn());

// ─── Module-level mocks ───────────────────────────────────────────────────

vi.mock("@/lib/security", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({ emails: { send: mockEmailSend } })),
}));

vi.mock("@/lib/activity", () => ({ logActivity: mockLogActivity }));

vi.mock("@/lib/db", () => {
  const prismaObj = {
    appointment: {
      findUnique: (...args: unknown[]) => mockAppointmentFindUnique(...args),
      update: (...args: unknown[]) => mockAppointmentUpdate(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotifCreate(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => mockNotifPrefFindUnique(...args),
    },
    notificationLog: {
      create: (...args: unknown[]) => mockNotifLogCreate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  };
  return { getPrisma: vi.fn(() => prismaObj), prisma: prismaObj };
});

// ─── Bus cleanup tracking ─────────────────────────────────────────────────



// ─── Fixtures ─────────────────────────────────────────────────────────────

const BASE_APPOINTMENT = {
  id: "apt-cancel-1",
  name: "Alice Smith",
  email: "alice@example.com" as string | null,
  preferredDate: new Date("2026-08-15T10:00:00Z"),
  preferredTime: "10:00",
  duration: 30,
  status: "PENDING",
  cancellationReason: null,
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "test-key";
  mockCheckRateLimit.mockReturnValue({ allowed: true, resetAt: Date.now() + 300_000 });
});

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("Booking Cancel Null-Guard: POST /api/booking/[id]/cancel", () => {
  it("sends cancellation email when appointment has an email", async () => {
    mockAppointmentFindUnique.mockResolvedValue({ ...BASE_APPOINTMENT, email: "alice@example.com" });
    mockAppointmentUpdate.mockResolvedValue({ ...BASE_APPOINTMENT, status: "CANCELLED" });

    const { POST } = await import("@/app/api/booking/[id]/cancel/route");

    const request = new Request("http://localhost:3000/api/booking/apt-cancel-1/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Changed my mind" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-cancel-1" }) });

    expect(response.status).toBe(200);
    // Cancellation email should be sent when email is present
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining("Emmett Anthony"),
        to: ["alice@example.com"],
        subject: "Appointment Cancelled",
        html: expect.stringContaining("Alice Smith"),
      })
    );
    // Email body should include the cancellation reason
    const call = mockEmailSend.mock.calls[0][0];
    expect(call.html).toContain("Changed my mind");
    expect(call.html).toContain("8/15/2026");
  });

  it("does NOT send cancellation email when appointment.email is null", async () => {
    // Appointment with null email
    mockAppointmentFindUnique.mockResolvedValue({ ...BASE_APPOINTMENT, email: null });
    mockAppointmentUpdate.mockResolvedValue({ ...BASE_APPOINTMENT, status: "CANCELLED", email: null });

    const { POST } = await import("@/app/api/booking/[id]/cancel/route");

    const request = new Request("http://localhost:3000/api/booking/apt-cancel-1/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "No longer needed" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-cancel-1" }) });

    expect(response.status).toBe(200);
    // No email should be sent when email is null
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("does NOT send cancellation email when appointment.email is empty string", async () => {
    mockAppointmentFindUnique.mockResolvedValue({ ...BASE_APPOINTMENT, email: "" });
    mockAppointmentUpdate.mockResolvedValue({ ...BASE_APPOINTMENT, status: "CANCELLED", email: "" });

    const { POST } = await import("@/app/api/booking/[id]/cancel/route");

    const request = new Request("http://localhost:3000/api/booking/apt-cancel-1/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, { params: Promise.resolve({ id: "apt-cancel-1" }) });

    expect(response.status).toBe(200);
    expect(mockEmailSend).not.toHaveBeenCalled();
  });
});
