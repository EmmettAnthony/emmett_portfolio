// ──────────────────────────────────────────────────────────────────────────────
// Wired API Endpoints — Integration Tests
// ──────────────────────────────────────────────────────────────────────────────
// Tests that status transitions in the calendar appointments, CRM invoices, and
// booking endpoints correctly trigger the notification event handlers.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());

// Notification handlers — we spy on these to verify they're called
const mockNotifyMeetingCompleted = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockNotifyAppointmentRescheduled = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockNotifyInvoicePaid = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockNotifyPaymentFailed = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockNotifyInvoiceOverdue = vi.hoisted(() => vi.fn().mockResolvedValue({}));

// Event-handler notification functions for booking + contact (wired through bus → SSE)
const mockNotifyAppointmentBooked = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockNotifyNewContactSubmission = vi.hoisted(() => vi.fn().mockResolvedValue({}));

// Also used by scheduled cron newsletter routes
const mockNotifyCampaignSent = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockNotifyNewSubscriber = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const mockInquiryEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

// Service inquiry, testimonial, and file upload handlers (newly wired)
const mockNotifyServiceInquiry = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockNotifyNewTestimonial = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockNotifyFileUploaded = vi.hoisted(() => vi.fn().mockResolvedValue({}));

// ─── Calendar appointments route mocks ─────────────────────────────────────

vi.mock("@/../auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/sentry", () => ({
  captureError: vi.fn(),
}));

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({
    emails: { send: mockInquiryEmailSend },
  })),
}));

vi.mock("@/lib/email/templates", () => ({
  appointmentConfirmationTemplate: vi.fn(() => ({ subject: "Confirmed", html: "" })),
  appointmentCancelledTemplate: vi.fn(() => ({ subject: "Cancelled", html: "" })),
  appointmentRescheduledTemplate: vi.fn(() => ({ subject: "Rescheduled", html: "" })),
}));

vi.mock("@/lib/notifications/event-handlers", () => ({
  notifyMeetingCompleted: mockNotifyMeetingCompleted,
  notifyAppointmentRescheduled: mockNotifyAppointmentRescheduled,
  notifyInvoicePaid: mockNotifyInvoicePaid,
  notifyPaymentFailed: mockNotifyPaymentFailed,
  notifyInvoiceOverdue: mockNotifyInvoiceOverdue,
  notifyAppointmentBooked: mockNotifyAppointmentBooked,
  notifyNewContactSubmission: mockNotifyNewContactSubmission,
  notifyCampaignSent: mockNotifyCampaignSent,
  notifyNewSubscriber: mockNotifyNewSubscriber,
  notifyServiceInquiry: mockNotifyServiceInquiry,
  notifyNewTestimonial: mockNotifyNewTestimonial,
  notifyFileUploaded: mockNotifyFileUploaded,
}));

// Additional mocks for booking POST route
vi.mock("@/lib/security", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, resetAt: Date.now() + 60000 })),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/email-templates", () => ({
  ownerBookingNotification: vi.fn(() => "<html>owner</html>"),
  clientConfirmation: vi.fn(() => "<html>client</html>"),
  contactNotification: vi.fn(() => "<html>contact</html>"),
}));

vi.mock("@/lib/google-calendar", () => ({
  createCalendarEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/actions/contact", () => ({
  submitContact: vi.fn().mockResolvedValue({ id: "contact-1" }),
}));

vi.mock("@/lib/cron/automation-processor", () => ({
  processWelcomeSeries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/webhooks", () => ({
  dispatchWebhook: vi.fn().mockResolvedValue(undefined),
}));

// ─── Prisma mocks (used by all endpoints) ──────────────────────────────────

const mockPrisma = {
  appointment: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  },
  appointmentLog: {
    create: vi.fn(),
  },
  crmInvoice: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  meetingType: {
    findUnique: vi.fn(),
  },
  contactEmailLog: {
    create: vi.fn(),
  },
  analyticsEvent: {
    create: vi.fn(),
  },
  newsletterSettings: {
    findUnique: vi.fn(),
  },
  subscriber: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  service: {
    findUnique: vi.fn(),
  },
  serviceInquiry: {
    create: vi.fn(),
  },
  testimonial: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => {
  // getPrisma returns the same mock object; prisma (named export) returns it too
  const prismaObj = mockPrisma;
  return {
    getPrisma: vi.fn(() => prismaObj),
    prisma: prismaObj,
  };
});

// ─── Fixtures ───────────────────────────────────────────────────────────────

const BASE_APPOINTMENT = {
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
  source: "WEBSITE",
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

const UPDATED_APPOINTMENT = {
  ...BASE_APPOINTMENT,
  status: "COMPLETED",
  completedAt: new Date(),
  meetingType: { name: "Strategy Session" },
};

const BASE_INVOICE = {
  id: "inv-1",
  invoiceNumber: "INV-001",
  amount: 2500,
  status: "SENT",
  dueDate: new Date("2026-08-01"),
  paidAt: null,
  clientId: "client-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  notes: null,
  pdfUrl: null,
  lineItems: [],
  client: {
    id: "client-1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonRequest(
  url: string,
  body: Record<string, unknown>,
  method = "PUT",
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Cast a plain Request to NextRequest for route handler compatibility */
function asNextRequest(req: Request): NextRequest {
  return req as unknown as NextRequest;
}

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/calendar/appointments/[id]
// ═════════════════════════════════════════════════════════════════════════════

describe("PUT /api/calendar/appointments/[id] — notification wiring", () => {
  const APPOINTMENT_URL = "http://localhost:3000/api/calendar/appointments/apt-1";

  beforeEach(() => {
    mockPrisma.appointment.findUnique.mockResolvedValue(BASE_APPOINTMENT);
    mockPrisma.appointment.update.mockResolvedValue(UPDATED_APPOINTMENT);
    mockPrisma.appointmentLog.create.mockResolvedValue({ id: "log-1" });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { PUT } = await import(
      "@/app/api/calendar/appointments/[id]/route"
    );
    const res = await PUT(asNextRequest(jsonRequest(APPOINTMENT_URL, { status: "COMPLETED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(res.status).toBe(401);
    expect(mockNotifyMeetingCompleted).not.toHaveBeenCalled();
  });

  it("returns 404 when appointment not found", async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue(null);

    const { PUT } = await import(
      "@/app/api/calendar/appointments/[id]/route"
    );
    const res = await PUT(asNextRequest(jsonRequest(APPOINTMENT_URL, { status: "COMPLETED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(res.status).toBe(404);
    expect(mockNotifyMeetingCompleted).not.toHaveBeenCalled();
  });

  it("triggers notifyMeetingCompleted when status changes to COMPLETED", async () => {
    const { PUT } = await import(
      "@/app/api/calendar/appointments/[id]/route"
    );
    const res = await PUT(asNextRequest(jsonRequest(APPOINTMENT_URL, { status: "COMPLETED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(res.status).toBe(200);
    expect(mockNotifyMeetingCompleted).toHaveBeenCalledTimes(1);
    expect(mockNotifyMeetingCompleted).toHaveBeenCalledWith(
      "John Doe",
      "Strategy Session",
      "/dashboard/calendar/appointments/apt-1",
    );
  });

  it("triggers notifyAppointmentRescheduled when status changes to RESCHEDULED", async () => {
    const newDate = new Date("2026-08-01T14:00:00Z");
    const DATE_RE = /\d{1,2}([\/\-.])\d{1,2}\1\d{4}/;

    const updatedRescheduled = {
      ...BASE_APPOINTMENT,
      status: "RESCHEDULED",
      preferredDate: newDate,
      meetingType: { name: "Consultation" },
    };
    mockPrisma.appointment.update.mockResolvedValue(updatedRescheduled);

    const { PUT } = await import(
      "@/app/api/calendar/appointments/[id]/route"
    );
    const res = await PUT(
      asNextRequest(jsonRequest(APPOINTMENT_URL, { status: "RESCHEDULED", preferredDate: "2026-08-01T14:00:00Z" })),
      { params: Promise.resolve({ id: "apt-1" }) },
    );

    expect(res.status).toBe(200);
    expect(mockNotifyAppointmentRescheduled).toHaveBeenCalledTimes(1);
    expect(mockNotifyAppointmentRescheduled).toHaveBeenCalledWith(
      "John Doe",
      "john@example.com",
      // Compare using locale-independent format to avoid CI flakiness
      expect.stringMatching(DATE_RE),
      expect.stringMatching(DATE_RE),
      "/dashboard/calendar/appointments/apt-1",
    );
  });

  it("does NOT trigger notification when status changes to CONFIRMED", async () => {
    const updatedConfirmed = {
      ...BASE_APPOINTMENT,
      status: "CONFIRMED",
      meetingType: { name: "Consultation" },
    };
    mockPrisma.appointment.update.mockResolvedValue(updatedConfirmed);

    const { PUT } = await import(
      "@/app/api/calendar/appointments/[id]/route"
    );
    const res = await PUT(asNextRequest(jsonRequest(APPOINTMENT_URL, { status: "CONFIRMED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(res.status).toBe(200);
    expect(mockNotifyMeetingCompleted).not.toHaveBeenCalled();
    expect(mockNotifyAppointmentRescheduled).not.toHaveBeenCalled();
  });

  it("uses 'Consultation' as default meeting type when meetingType is null", async () => {
    const updatedNoMeetingType = {
      ...BASE_APPOINTMENT,
      status: "COMPLETED",
      completedAt: new Date(),
      meetingType: null,
    };
    mockPrisma.appointment.update.mockResolvedValue(updatedNoMeetingType);

    const { PUT } = await import(
      "@/app/api/calendar/appointments/[id]/route"
    );
    await PUT(asNextRequest(jsonRequest(APPOINTMENT_URL, { status: "COMPLETED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(mockNotifyMeetingCompleted).toHaveBeenCalledWith(
      "John Doe",
      "Consultation",
      "/dashboard/calendar/appointments/apt-1",
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/booking/[id]
// ═════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/booking/[id] — notification wiring", () => {
  const BOOKING_URL = "http://localhost:3000/api/booking/apt-1";

  beforeEach(() => {
    mockPrisma.appointment.findUnique.mockResolvedValue(BASE_APPOINTMENT);
    mockPrisma.appointment.update.mockResolvedValue(UPDATED_APPOINTMENT);
  });

  it("triggers notifyMeetingCompleted when status changes to COMPLETED", async () => {
    const { PATCH } = await import("@/app/api/booking/[id]/route");
    const res = await PATCH(asNextRequest(jsonRequest(BOOKING_URL, { status: "COMPLETED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(res.status).toBe(200);
    expect(mockNotifyMeetingCompleted).toHaveBeenCalledTimes(1);
    expect(mockNotifyMeetingCompleted).toHaveBeenCalledWith(
      "John Doe",
      "Consultation",
      "/dashboard/calendar/appointments/apt-1",
    );
  });

  it("does NOT trigger notifyMeetingCompleted for non-COMPLETED status changes", async () => {
    const { PATCH } = await import("@/app/api/booking/[id]/route");
    const res = await PATCH(asNextRequest(jsonRequest(BOOKING_URL, { status: "CONFIRMED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(res.status).toBe(200);
    expect(mockNotifyMeetingCompleted).not.toHaveBeenCalled();
  });

  it("does NOT trigger notification if status is already COMPLETED", async () => {
    // Existing appointment is already COMPLETED
    mockPrisma.appointment.findUnique.mockResolvedValue({
      ...BASE_APPOINTMENT,
      status: "COMPLETED",
    });

    const { PATCH } = await import("@/app/api/booking/[id]/route");
    const res = await PATCH(asNextRequest(jsonRequest(BOOKING_URL, { status: "COMPLETED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(res.status).toBe(200);
    // The PATCH handler checks: if (body.status === "COMPLETED" && existing.status !== "COMPLETED")
    // Since they're both COMPLETED, notification should NOT fire
    expect(mockNotifyMeetingCompleted).not.toHaveBeenCalled();
  });

  it("returns 404 when appointment not found", async () => {
    mockPrisma.appointment.findUnique.mockResolvedValue(null);

    const { PATCH } = await import("@/app/api/booking/[id]/route");
    const res = await PATCH(asNextRequest(jsonRequest(BOOKING_URL, { status: "COMPLETED" })), {
      params: Promise.resolve({ id: "apt-1" }),
    });

    expect(res.status).toBe(404);
    expect(mockNotifyMeetingCompleted).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/dashboard/crm/invoices/[id]
// ═════════════════════════════════════════════════════════════════════════════

describe("PUT /api/dashboard/crm/invoices/[id] — notification wiring", () => {
  const INVOICE_URL = "http://localhost:3000/api/dashboard/crm/invoices/inv-1";

  beforeEach(() => {
    mockPrisma.crmInvoice.findUnique.mockResolvedValue(BASE_INVOICE);
    mockPrisma.crmInvoice.update.mockImplementation(
      async (_args: unknown) => {
        // Return the invoice with the new status from the request body
        // (the test passes body via the request, but we can't access it here;
        //  instead we return a simple updated version)
        return { ...BASE_INVOICE, status: "PAID", paidAt: new Date() };
      },
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { PUT } = await import(
      "@/app/api/dashboard/crm/invoices/[id]/route"
    );
    const res = await PUT(asNextRequest(jsonRequest(INVOICE_URL, { status: "PAID" })), {
      params: Promise.resolve({ id: "inv-1" }),
    });

    expect(res.status).toBe(401);
    expect(mockNotifyInvoicePaid).not.toHaveBeenCalled();
  });

  it("returns 404 when invoice not found", async () => {
    mockPrisma.crmInvoice.findUnique.mockResolvedValue(null);

    const { PUT } = await import(
      "@/app/api/dashboard/crm/invoices/[id]/route"
    );
    const res = await PUT(asNextRequest(jsonRequest(INVOICE_URL, { status: "PAID" })), {
      params: Promise.resolve({ id: "inv-1" }),
    });

    expect(res.status).toBe(404);
    expect(mockNotifyInvoicePaid).not.toHaveBeenCalled();
  });

  it("triggers notifyInvoicePaid when status changes to PAID", async () => {
    const { PUT } = await import(
      "@/app/api/dashboard/crm/invoices/[id]/route"
    );
    const res = await PUT(asNextRequest(jsonRequest(INVOICE_URL, { status: "PAID" })), {
      params: Promise.resolve({ id: "inv-1" }),
    });

    expect(res.status).toBe(200);
    expect(mockNotifyInvoicePaid).toHaveBeenCalledTimes(1);
    // The handler passes: displayNumber, clientName, amount, paidDate, link
    const callArgs = mockNotifyInvoicePaid.mock.calls[0];
    expect(callArgs[0]).toBe("INV-001");                // invoiceNumber
    expect(callArgs[1]).toBe("Jane Doe");               // clientName
    expect(callArgs[2]).toBe(2500);                     // amount
    expect(callArgs[3]).toEqual(expect.stringMatching(/\d{1,2}([\/\-.])\d{1,2}\1\d{4}/)); // date string (consistent separator)
    expect(callArgs[4]).toBe("/dashboard/crm/invoices/inv-1"); // link
  });

  it("triggers notifyInvoiceOverdue when status changes to OVERDUE", async () => {
    mockPrisma.crmInvoice.update.mockResolvedValue({
      ...BASE_INVOICE,
      status: "OVERDUE",
    });

    const { PUT } = await import(
      "@/app/api/dashboard/crm/invoices/[id]/route"
    );
    const res = await PUT(asNextRequest(jsonRequest(INVOICE_URL, { status: "OVERDUE" })), {
      params: Promise.resolve({ id: "inv-1" }),
    });

    expect(res.status).toBe(200);
    expect(mockNotifyInvoiceOverdue).toHaveBeenCalledTimes(1);
    const callArgs = mockNotifyInvoiceOverdue.mock.calls[0];
    expect(callArgs[0]).toBe("INV-001");                 // invoiceNumber
    expect(callArgs[1]).toBe("Jane Doe");                // clientName
    expect(callArgs[2]).toBe(2500);                      // amount
    expect(callArgs[3]).toEqual(expect.stringContaining("8/1")); // dueDate
  });

  it("does NOT trigger invoice notification when status stays the same", async () => {
    // Existing invoice is already PAID
    mockPrisma.crmInvoice.findUnique.mockResolvedValue({
      ...BASE_INVOICE,
      status: "PAID",
    });
    mockPrisma.crmInvoice.update.mockResolvedValue({
      ...BASE_INVOICE,
      status: "PAID",
    });

    const { PUT } = await import(
      "@/app/api/dashboard/crm/invoices/[id]/route"
    );
    await PUT(asNextRequest(jsonRequest(INVOICE_URL, { notes: "updated note" })), {
      params: Promise.resolve({ id: "inv-1" }),
    });

    expect(mockNotifyInvoicePaid).not.toHaveBeenCalled();
    expect(mockNotifyPaymentFailed).not.toHaveBeenCalled();
    expect(mockNotifyInvoiceOverdue).not.toHaveBeenCalled();
  });

  it('uses "Unknown" as client name when invoice has no client', async () => {
    const invoiceNoClient = { ...BASE_INVOICE, client: null };
    mockPrisma.crmInvoice.findUnique.mockResolvedValue(invoiceNoClient);
    mockPrisma.crmInvoice.update.mockResolvedValue({
      ...invoiceNoClient,
      status: "PAID",
      paidAt: new Date(),
    });

    const { PUT } = await import(
      "@/app/api/dashboard/crm/invoices/[id]/route"
    );
    await PUT(asNextRequest(jsonRequest(INVOICE_URL, { status: "PAID" })), {
      params: Promise.resolve({ id: "inv-1" }),
    });

    expect(mockNotifyInvoicePaid).toHaveBeenCalledWith(
      expect.any(String),
      "Unknown",
      expect.any(Number),
      expect.any(String),
      expect.any(String),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/booking — notifyAppointmentBooked (event-handlers, wired through bus)
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/booking — notifyAppointmentBooked wiring", () => {
  const BOOKING_URL = "http://localhost:3000/api/booking";

  const validBody = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "+1234567890",
    preferredDate: "2026-08-15",
    preferredTime: "14:00",
    duration: 30,
    projectType: "Other",
    projectDescription: "I need a website built with modern tech",
    terms: true,
    turnstileToken: "mock-token",
  };

  const CREATED_APPOINTMENT = {
    id: "apt-booking-1",
    name: "Jane Doe",
    email: "jane@example.com",
    preferredDate: new Date("2026-08-15T00:00:00Z"),
    preferredTime: "14:00",
    status: "PENDING",
    duration: 30,
  };

  beforeEach(() => {
    // No existing slot conflict
    mockPrisma.appointment.findFirst.mockResolvedValue(null);
    mockPrisma.appointment.create.mockResolvedValue(CREATED_APPOINTMENT);
    mockPrisma.contactEmailLog.create.mockResolvedValue({ id: "log-1" });
    mockPrisma.analyticsEvent.create.mockResolvedValue({});
  });

  it("triggers notifyAppointmentBooked after successful appointment creation", async () => {
    const { POST } = await import("@/app/api/booking/route");
    const res = await POST(new Request(BOOKING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(201);
    expect(mockNotifyAppointmentBooked).toHaveBeenCalledTimes(1);
    expect(mockNotifyAppointmentBooked).toHaveBeenCalledWith(
      "Jane Doe",
      "jane@example.com",
      "2026-08-15",
      "Consultation",
      "/dashboard/calendar/appointments/apt-booking-1",
    );
  });

  it("does NOT trigger notifyAppointmentBooked when validation fails", async () => {
    const { POST } = await import("@/app/api/booking/route");
    const res = await POST(new Request(BOOKING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "", lastName: "", email: "bad", terms: false }),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockNotifyAppointmentBooked).not.toHaveBeenCalled();
  });

  it("does NOT trigger notifyAppointmentBooked when turnstile verification fails", async () => {
    // Mock turnstile to fail — need to access the mock dynamically
    const { verifyTurnstile } = await import("@/lib/turnstile");
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const { POST } = await import("@/app/api/booking/route");
    const res = await POST(new Request(BOOKING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockNotifyAppointmentBooked).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/contact — notifyNewContactSubmission (event-handlers, wired through bus)
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/contact — notifyNewContactSubmission wiring", () => {
  const CONTACT_URL = "http://localhost:3000/api/contact";

  const validBody = {
    name: "Alice Smith",
    email: "alice@example.com",
    subject: "Project Inquiry",
    message: "I would like to discuss a project for my business. This is over 10 chars.",
    projectType: "web_development",
    turnstileToken: "mock-token",
  };

  it("triggers notifyNewContactSubmission after successful contact submission", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(new Request(CONTACT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(201);
    expect(mockNotifyNewContactSubmission).toHaveBeenCalledTimes(1);
    expect(mockNotifyNewContactSubmission).toHaveBeenCalledWith(
      "Alice Smith",
      "alice@example.com",
      "web_development",
      "/dashboard/contact/submissions",
    );
  });

  it("does NOT trigger notifyNewContactSubmission when validation fails", async () => {
    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(new Request(CONTACT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "bad", subject: "", message: "", projectType: "" }),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockNotifyNewContactSubmission).not.toHaveBeenCalled();
  });

  it("does NOT trigger notifyNewContactSubmission when turnstile verification fails", async () => {
    const { verifyTurnstile } = await import("@/lib/turnstile");
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const { POST } = await import("@/app/api/contact/route");
    const res = await POST(new Request(CONTACT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockNotifyNewContactSubmission).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/newsletter/signup — notifyNewSubscriber (non-doubleOptIn path)
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/newsletter/signup — notifyNewSubscriber wiring", () => {
  const SIGNUP_URL = "http://localhost:3000/api/newsletter/signup";

  const validBody = {
    name: "Jane Doe",
    email: "jane@example.com",
    gdprConsent: true,
    source: "website",
  };

  const CREATED_SUBSCRIBER = {
    id: "sub-1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    status: "ACTIVE",
    source: "website",
  };

  beforeEach(() => {
    // No existing subscriber
    mockPrisma.subscriber.findUnique.mockResolvedValue(null);
    // Non-double-opt-in settings = notification fires immediately
    mockPrisma.newsletterSettings.findUnique.mockResolvedValue({
      id: "global",
      doubleOptIn: false,
    });
    // New subscriber created
    mockPrisma.subscriber.create.mockResolvedValue(CREATED_SUBSCRIBER);
    mockPrisma.analyticsEvent.create.mockResolvedValue({});
  });

  it("triggers notifyNewSubscriber after successful signup", async () => {
    const { POST } = await import("@/app/api/newsletter/signup/route");
    const res = await POST(new Request(SIGNUP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(201);
    expect(mockNotifyNewSubscriber).toHaveBeenCalledTimes(1);
    expect(mockNotifyNewSubscriber).toHaveBeenCalledWith(
      "Jane Doe",
      "jane@example.com",
      "website",
    );
  });

  it("does NOT trigger notifyNewSubscriber when validation fails", async () => {
    const { POST } = await import("@/app/api/newsletter/signup/route");
    const res = await POST(new Request(SIGNUP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockNotifyNewSubscriber).not.toHaveBeenCalled();
  });

  it("does NOT trigger notifyNewSubscriber when rate limited", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() + 60000 });

    const { POST } = await import("@/app/api/newsletter/signup/route");
    const res = await POST(new Request(SIGNUP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(429);
    expect(mockNotifyNewSubscriber).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/services/inquiry — notifyServiceInquiry
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/services/inquiry — notifyServiceInquiry wiring", () => {
  const INQUIRY_URL = "http://localhost:3000/api/services/inquiry";

  const validBody = {
    fullName: "Bob Smith",
    email: "bob@example.com",
    phone: "+1234567890",
    serviceName: "Web Development",
    message: "I need a website built",
  };

  const CREATED_INQUIRY = {
    id: "inquiry-1",
    fullName: "Bob Smith",
    email: "bob@example.com",
    serviceName: "Web Development",
    message: "I need a website built",
    status: "NEW",
  };

  beforeEach(() => {
    mockPrisma.service.findUnique.mockResolvedValue({ id: "svc-1", published: true });
    mockPrisma.serviceInquiry.create.mockResolvedValue(CREATED_INQUIRY);
  });

  it("triggers notifyServiceInquiry after successful inquiry submission", async () => {
    const { POST } = await import("@/app/api/services/inquiry/route");
    const res = await POST(new Request(INQUIRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(201);
    expect(mockNotifyServiceInquiry).toHaveBeenCalledTimes(1);
    expect(mockNotifyServiceInquiry).toHaveBeenCalledWith(
      "Bob Smith",
      "bob@example.com",
      "Web Development",
      "/dashboard/services/inquiries",
    );

    // Verify two emails were sent (owner notification + client confirmation)
    expect(mockInquiryEmailSend).toHaveBeenCalledTimes(2);

    // Owner notification: to site owner, subject with [Service Inquiry] prefix
    expect(mockInquiryEmailSend).toHaveBeenCalledWith({
      from: expect.stringContaining("@"),
      to: "emmettanthony998@gmail.com",
      replyTo: "bob@example.com",
      subject: expect.stringContaining("[Service Inquiry]"),
      html: expect.stringContaining("New Service Inquiry"),
    });
    // Verify owner notification body includes submitter details
    const ownerCall = mockInquiryEmailSend.mock.calls[0][0];
    expect(ownerCall.html).toContain("Bob Smith");
    expect(ownerCall.html).toContain("bob@example.com");
    expect(ownerCall.html).toContain("Web Development");
    expect(ownerCall.html).toContain("I need a website built");
    expect(ownerCall.html).toContain("+1234567890");
    expect(ownerCall.html).toContain("/dashboard/services/inquiries");

    // Client confirmation: to the inquirer, subject with "Thank you"
    expect(mockInquiryEmailSend).toHaveBeenCalledWith({
      from: expect.stringContaining("@"),
      to: "bob@example.com",
      subject: expect.stringContaining("Thank you for your inquiry"),
      html: expect.stringContaining("Thank You"),
    });
    // Verify client confirmation body includes the inquirer's name and service
    const clientCall = mockInquiryEmailSend.mock.calls[1][0];
    expect(clientCall.html).toContain("Dear Bob Smith,");
    expect(clientCall.html).toContain("Web Development");
    expect(clientCall.html).toContain("/portfolio");
  });

  it("does NOT trigger notifyServiceInquiry when validation fails", async () => {
    const { POST } = await import("@/app/api/services/inquiry/route");
    const res = await POST(new Request(INQUIRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "", email: "bad" }),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockNotifyServiceInquiry).not.toHaveBeenCalled();
  });

  it("returns 400 when email is empty string", async () => {
    const { POST } = await import("@/app/api/services/inquiry/route");
    const res = await POST(new Request(INQUIRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, email: "" }),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockInquiryEmailSend).not.toHaveBeenCalled();
    expect(mockNotifyServiceInquiry).not.toHaveBeenCalled();
  });

  it("returns 400 when email is null", async () => {
    const { POST } = await import("@/app/api/services/inquiry/route");
    const res = await POST(new Request(INQUIRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, email: null }),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockInquiryEmailSend).not.toHaveBeenCalled();
    expect(mockNotifyServiceInquiry).not.toHaveBeenCalled();
  });

  it("returns 400 when email is whitespace-only", async () => {
    const { POST } = await import("@/app/api/services/inquiry/route");
    const res = await POST(new Request(INQUIRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, email: "   " }),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockInquiryEmailSend).not.toHaveBeenCalled();
    expect(mockNotifyServiceInquiry).not.toHaveBeenCalled();
  });

  it("does NOT trigger notifyServiceInquiry when rate limited", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() + 60000 });

    const { POST } = await import("@/app/api/services/inquiry/route");
    const res = await POST(new Request(INQUIRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(429);
    expect(mockNotifyServiceInquiry).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/testimonials/submit — notifyNewTestimonial
// ═════════════════════════════════════════════════════════════════════════════

describe("POST /api/testimonials/submit — notifyNewTestimonial wiring", () => {
  const TESTIMONIAL_URL = "http://localhost:3000/api/testimonials/submit";

  const validBody = {
    name: "Alice Smith",
    email: "alice@example.com",
    rating: 5,
    content: "Amazing work! Highly recommend.",
  };

  const CREATED_TESTIMONIAL = {
    id: "test-1",
    name: "Alice Smith",
    email: "alice@example.com",
    rating: 5,
    content: "Amazing work! Highly recommend.",
    status: "PENDING_REVIEW",
  };

  beforeEach(() => {
    mockPrisma.testimonial.create.mockResolvedValue(CREATED_TESTIMONIAL);
  });

  it("triggers notifyNewTestimonial after successful testimonial submission", async () => {
    const { POST } = await import("@/app/api/testimonials/submit/route");
    const res = await POST(new Request(TESTIMONIAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(201);
    expect(mockNotifyNewTestimonial).toHaveBeenCalledTimes(1);
    expect(mockNotifyNewTestimonial).toHaveBeenCalledWith(
      "Alice Smith",
      5,
      "/dashboard/testimonials",
    );
  });

  it("does NOT trigger notifyNewTestimonial when missing required fields", async () => {
    const { POST } = await import("@/app/api/testimonials/submit/route");
    const res = await POST(new Request(TESTIMONIAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@example.com" }),
    }) as unknown as NextRequest);

    expect(res.status).toBe(400);
    expect(mockNotifyNewTestimonial).not.toHaveBeenCalled();
  });

  it("does NOT trigger notifyNewTestimonial when rate limited", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() + 60000 });

    const { POST } = await import("@/app/api/testimonials/submit/route");
    const res = await POST(new Request(TESTIMONIAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    }) as unknown as NextRequest);

    expect(res.status).toBe(429);
    expect(mockNotifyNewTestimonial).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// UploadThing onUploadComplete — notifyFileUploaded (tested via direct call)
// ═════════════════════════════════════════════════════════════════════════════

describe("UploadThing upload complete — notifyFileUploaded wiring", () => {
  it("calls notifyFileUploaded from imageUploader's onUploadComplete", async () => {
    // Import the file router and extract the imageUploader's onUploadComplete
    const { ourFileRouter } = await import("@/lib/uploadthing");
    const uploader = ourFileRouter.imageUploader as unknown as {
      onUploadComplete?: (args: { file: { name: string; size: number; url: string } }) => void;
    };

    // Call onUploadComplete directly (UploadThing calls it after upload)
    await uploader.onUploadComplete?.({
      file: { name: "screenshot.png", size: 2_097_152, url: "https://utfs.io/f/abc123" },
    });

    expect(mockNotifyFileUploaded).toHaveBeenCalledTimes(1);
    // 2MB file → "2.0MB"
    expect(mockNotifyFileUploaded).toHaveBeenCalledWith(
      "screenshot.png",
      "2.0MB",
      "admin",
    );
  });

  it("calls notifyFileUploaded from mediaUploader's onUploadComplete", async () => {
    const { ourFileRouter } = await import("@/lib/uploadthing");
    const uploader = ourFileRouter.mediaUploader as unknown as {
      onUploadComplete?: (args: { file: { name: string; size: number; url: string } }) => void;
    };

    await uploader.onUploadComplete?.({
      file: { name: "portfolio.jpg", size: 5_242_880, url: "https://utfs.io/f/def456" },
    });

    expect(mockNotifyFileUploaded).toHaveBeenCalledTimes(1);
    expect(mockNotifyFileUploaded).toHaveBeenCalledWith(
      "portfolio.jpg",
      "5.0MB",
      "admin",
    );
  });
});
