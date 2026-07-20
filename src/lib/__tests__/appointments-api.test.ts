import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockCaptureError = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true, remaining: 10, reset: Date.now() + 60000 }));
const mockResendSend = vi.hoisted(() => vi.fn());
const mockGetResend = vi.hoisted(() => vi.fn(() => ({ emails: { send: mockResendSend } })));
const mockConfirmationTemplate = vi.hoisted(() => vi.fn(() => ({
  subject: "Consultation Booking Confirmed",
  html: "<html>mock</html>",
})));

vi.mock("@/../auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/sentry", () => ({
  captureError: mockCaptureError,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
}));

vi.mock("@/lib/resend", () => ({
  getResend: mockGetResend,
}));

vi.mock("@/lib/email/templates", () => ({
  appointmentConfirmationTemplate: mockConfirmationTemplate,
}));

const mockPrisma = {
  appointment: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  appointmentLog: {
    create: vi.fn(),
  },
  calendarEvent: {
    create: vi.fn(),
  },
  availability: {
    findFirst: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

// ─── Reset mocks between tests ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Default: authenticated as admin
  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
  // Default: allow rate limit through
  mockRateLimit.mockResolvedValue({ success: true, remaining: 10, reset: Date.now() + 60000 });
  // Default: enough slots available
  mockPrisma.availability.findFirst.mockResolvedValue({
    dayOfWeek: 3, // Wednesday
    isActive: true,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
  });
  mockPrisma.appointment.count.mockResolvedValue(0);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockRequest(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { "x-forwarded-for": "127.0.0.1" },
    ...options,
  });
}

function mockJsonRequest(body: Record<string, unknown>, method = "POST"): Request {
  return new Request("http://localhost:3000/api/calendar/appointments", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  name: "John Doe",
  email: "john@example.com",
  preferredDate: "2026-07-22T10:00:00Z",
  preferredTime: "10:00",
  duration: 30,
  message: "Looking forward to it",
  timezone: "America/New_York",
};

const MOCK_CREATED_APPOINTMENT = {
  id: "apt-1",
  name: "John Doe",
  email: "john@example.com",
  phone: null,
  company: null,
  projectType: null,
  preferredDate: new Date("2026-07-22T10:00:00Z"),
  preferredTime: "10:00",
  duration: 30,
  message: "Looking forward to it",
  notes: null,
  status: "PENDING",
  source: "DASHBOARD",
  timezone: "America/New_York",
  meetingTypeId: null,
  contactId: null,
  projectId: null,
  clientId: null,
  cancellationReason: null,
  createdAt: new Date("2026-07-20T12:00:00Z"),
  updatedAt: new Date("2026-07-20T12:00:00Z"),
  meetingType: null,
};

// ─── GET /api/calendar/appointments ──────────────────────────────────────────

describe("GET /api/calendar/appointments", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import("@/app/api/calendar/appointments/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/appointments"));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns empty list with pagination when no appointments exist", async () => {
    mockPrisma.appointment.findMany.mockResolvedValue([]);
    mockPrisma.appointment.count.mockResolvedValue(0);

    const { GET } = await import("@/app/api/calendar/appointments/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/appointments"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.appointments).toEqual([]);
    expect(body.pagination).toEqual({ page: 1, total: 0, pages: 0 });
  });

  it("maps query params to Prisma filters", async () => {
    mockPrisma.appointment.findMany.mockResolvedValue([MOCK_CREATED_APPOINTMENT]);
    mockPrisma.appointment.count.mockResolvedValue(1);

    const { GET } = await import("@/app/api/calendar/appointments/route");
    const url = "http://localhost:3000/api/calendar/appointments?status=CONFIRMED&meetingTypeId=mt-1&startDate=2026-07-01&endDate=2026-07-31&search=jane&page=2&limit=5";
    await GET(mockRequest(url));

    const findManyCall = mockPrisma.appointment.findMany.mock.calls[0][0];
    expect(findManyCall.where.status).toBe("CONFIRMED");
    expect(findManyCall.where.meetingTypeId).toBe("mt-1");
    expect(findManyCall.where.preferredDate).toEqual({
      gte: new Date("2026-07-01"),
      lte: new Date("2026-07-31"),
    });
    expect(findManyCall.where.OR).toBeDefined();
    expect(findManyCall.skip).toBe(5);
    expect(findManyCall.take).toBe(5);
  });

  it("includes appointment logs and meetingType in results", async () => {
    mockPrisma.appointment.findMany.mockResolvedValue([MOCK_CREATED_APPOINTMENT]);
    mockPrisma.appointment.count.mockResolvedValue(1);

    const { GET } = await import("@/app/api/calendar/appointments/route");
    await GET(mockRequest("http://localhost:3000/api/calendar/appointments"));

    const findManyCall = mockPrisma.appointment.findMany.mock.calls[0][0];
    expect(findManyCall.include).toBeDefined();
    expect(findManyCall.include.meetingType).toBe(true);
    expect(findManyCall.include.appointmentLogs).toBeDefined();
  });

  it("clamps page to minimum of 1", async () => {
    mockPrisma.appointment.findMany.mockResolvedValue([]);
    mockPrisma.appointment.count.mockResolvedValue(0);

    const { GET } = await import("@/app/api/calendar/appointments/route");
    await GET(mockRequest("http://localhost:3000/api/calendar/appointments?page=0"));

    const call = mockPrisma.appointment.findMany.mock.calls[0][0];
    expect(call.skip).toBe(0);
  });

  it("clamps limit to maximum of 100", async () => {
    mockPrisma.appointment.findMany.mockResolvedValue([]);
    mockPrisma.appointment.count.mockResolvedValue(0);

    const { GET } = await import("@/app/api/calendar/appointments/route");
    await GET(mockRequest("http://localhost:3000/api/calendar/appointments?limit=999"));

    const call = mockPrisma.appointment.findMany.mock.calls[0][0];
    expect(call.take).toBe(100);
  });

  it("returns 500 and captures error when Prisma throws", async () => {
    mockPrisma.appointment.findMany.mockRejectedValue(new Error("DB down"));

    const { GET } = await import("@/app/api/calendar/appointments/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/appointments"));

    expect(res.status).toBe(500);
    expect(mockCaptureError).toHaveBeenCalled();
  });
});

// ─── POST /api/calendar/appointments ─────────────────────────────────────────

describe("POST /api/calendar/appointments", () => {
  beforeEach(() => {
    mockPrisma.appointment.create.mockResolvedValue(MOCK_CREATED_APPOINTMENT);
    mockPrisma.calendarEvent.create.mockResolvedValue({ id: "ce-1" });
    mockPrisma.appointmentLog.create.mockResolvedValue({ id: "log-1" });
  });

  // ── Auth guard & rate limiting ──────────────────────────────────────────

  // Note: POST does NOT require authentication (it's a public booking endpoint).
  // Instead it applies rate limiting for unauthenticated requests.

  it("allows unauthenticated requests through but rate limits them", async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest(VALID_BODY));

    // Should have checked rate limit first
    expect(mockRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("booking:127.0.0.1"),
      3,
      60_000
    );
    // Should still succeed if rate limit passes
    expect(res.status).toBe(201);
  });

  it("returns 429 when rate limited for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);
    mockRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60000 });

    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest(VALID_BODY));

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Too many requests");
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("skips rate limiting for authenticated requests", async () => {
    // mockAuth already returns admin user by default
    const { POST } = await import("@/app/api/calendar/appointments/route");
    await POST(mockJsonRequest(VALID_BODY));

    // rateLimit should NOT have been called since session exists
    // (the code skips rate limiting when session is present)
    expect(mockRateLimit).not.toHaveBeenCalled();
  });

  // ── Validation ──────────────────────────────────────────────────────────

  it("returns 400 when name is missing", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest({ email: "john@example.com", preferredDate: "2026-07-22" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest({ ...VALID_BODY, email: "not-an-email" }));

    expect(res.status).toBe(400);
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("returns 400 when email is null", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest({ ...VALID_BODY, email: null }));

    expect(res.status).toBe(400);
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("returns 400 when email is undefined", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const { email: _, ...bodyWithoutEmail } = VALID_BODY;
    const res = await POST(mockJsonRequest(bodyWithoutEmail));

    expect(res.status).toBe(400);
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("returns 400 when email is empty string", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest({ ...VALID_BODY, email: "" }));

    expect(res.status).toBe(400);
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("returns 400 when email is whitespace-only", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest({ ...VALID_BODY, email: "   " }));

    expect(res.status).toBe(400);
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("returns 400 when email has leading whitespace", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest({ ...VALID_BODY, email: "  john@example.com" }));

    expect(res.status).toBe(400);
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("returns 400 when email has trailing whitespace", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest({ ...VALID_BODY, email: "john@example.com  " }));

    expect(res.status).toBe(400);
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  // ── Conflict detection ──────────────────────────────────────────────────

  it("returns 409 when no time slots are available on the selected date", async () => {
    // Mock max slots calculated from availability (09:00-17:00 / 30min = 16 slots)
    // Simulate all slots taken
    mockPrisma.appointment.count.mockResolvedValue(16);

    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest(VALID_BODY));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("No available time slots on this date");
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("falls back to 8 max slots when no availability config exists", async () => {
    mockPrisma.availability.findFirst.mockResolvedValue(null);
    // 8 slots is the fallback max
    mockPrisma.appointment.count.mockResolvedValue(8);

    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest(VALID_BODY));

    expect(res.status).toBe(409);
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
  });

  it("does not conflict with cancelled or no-show appointments", async () => {
    mockPrisma.appointment.count.mockResolvedValue(0);

    const { POST } = await import("@/app/api/calendar/appointments/route");
    await POST(mockJsonRequest(VALID_BODY));

    // The conflict query should filter out CANCELLED and NO_SHOW
    const countWhere = mockPrisma.appointment.count.mock.calls[0][0].where;
    expect(countWhere.status.notIn).toContain("CANCELLED");
    expect(countWhere.status.notIn).toContain("NO_SHOW");
  });

  // ── Successful creation (authenticated) ─────────────────────────────────

  it("creates appointment, activity log, and calendar event for authenticated users", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest(VALID_BODY));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.appointment.id).toBe("apt-1");
    expect(body.appointment.name).toBe("John Doe");

    // Verify appointment creation
    expect(mockPrisma.appointment.create).toHaveBeenCalledTimes(1);
    const createData = mockPrisma.appointment.create.mock.calls[0][0].data;
    expect(createData.name).toBe("John Doe");
    expect(createData.email).toBe("john@example.com");
    expect(createData.source).toBe("DASHBOARD");
    expect(createData.status).toBe("PENDING");

    // Verify activity log
    expect(mockPrisma.appointmentLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointmentId: "apt-1",
        action: "CREATED",
        ip: "127.0.0.1",
      }),
    });

    // Verify calendar event creation
    expect(mockPrisma.calendarEvent.create).toHaveBeenCalledTimes(1);
    const eventData = mockPrisma.calendarEvent.create.mock.calls[0][0].data;
    expect(eventData.title).toBe("Appointment: John Doe");
    expect(eventData.eventType).toBe("CONSULTATION");
    expect(eventData.appointmentId).toBe("apt-1");
    // Verify event dates: 2026-07-22T10:00 + 30min
    expect(eventData.startDate.toISOString()).toContain("2026-07-22T10:00");
    expect(eventData.endDate.toISOString()).toContain("2026-07-22T10:30");
  });

  it("does not send confirmation email for authenticated admin bookings", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    await POST(mockJsonRequest(VALID_BODY));

    // Email is only sent for non-session (public) bookings
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  // ── Successful creation (unauthenticated) ───────────────────────────────

  it("sends confirmation email for unauthenticated (public) bookings", async () => {
    mockAuth.mockResolvedValue(null);
    mockPrisma.appointment.create.mockResolvedValue({
      ...MOCK_CREATED_APPOINTMENT,
      source: "WEBSITE",
    });

    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest(VALID_BODY));

    expect(res.status).toBe(201);

    // Email template called with correct params
    expect(mockConfirmationTemplate).toHaveBeenCalledWith({
      name: "John Doe",
      date: "2026-07-22T10:00:00Z",
      time: "10:00",
      duration: 30,
      meetingType: null,
      message: "Looking forward to it",
      timezone: "America/New_York",
    });

    // Email sent
    expect(mockResendSend).toHaveBeenCalledWith({
      from: expect.stringContaining("Emmett Anthony"),
      to: "john@example.com",
      subject: "Consultation Booking Confirmed",
      html: "<html>mock</html>",
    });
  });

  it("does not block the response when email sending fails", async () => {
    mockAuth.mockResolvedValue(null);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockResendSend.mockRejectedValue(new Error("SMTP error"));

    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest(VALID_BODY));

    // Still returns 201 even though email failed
    expect(res.status).toBe(201);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // ── Error handling ──────────────────────────────────────────────────────

  it("returns 500 when appointment creation fails", async () => {
    mockPrisma.appointment.create.mockRejectedValue(new Error("Create failed"));

    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(mockJsonRequest(VALID_BODY));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed");
    expect(mockCaptureError).toHaveBeenCalled();
  });

  it("returns 500 when JSON parsing fails", async () => {
    const { POST } = await import("@/app/api/calendar/appointments/route");
    const res = await POST(new Request("http://localhost:3000/api/calendar/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
      body: "not-json",
    }));

    expect(res.status).toBe(500);
  });

  it("sets status to PENDING for unauthenticated bookings regardless of body status", async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import("@/app/api/calendar/appointments/route");
    await POST(mockJsonRequest({ ...VALID_BODY, status: "CONFIRMED" }));

    const createData = mockPrisma.appointment.create.mock.calls[0][0].data;
    expect(createData.status).toBe("PENDING");
    expect(createData.source).toBe("WEBSITE");
  });
});
