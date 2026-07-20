import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockCaptureError = vi.hoisted(() => vi.fn());
const mockExportEvent = vi.hoisted(() => vi.fn());
const mockDeleteEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/../auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/sentry", () => ({
  captureError: mockCaptureError,
}));

vi.mock("@/lib/calendar/google", () => ({
  exportEvent: mockExportEvent,
  deleteEvent: mockDeleteEvent,
}));

const mockPrisma = {
  calendarEvent: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

// ─── Reset mocks between tests ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockRequest(url: string, options?: RequestInit): Request {
  return new Request(url, options);
}

function mockJsonResponse<T>(body: T, _status = 200): Request {
  return new Request("http://localhost:3000/api/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── events/route.ts ─────────────────────────────────────────────────────────

describe("GET /api/calendar/events", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
    mockPrisma.calendarEvent.findMany.mockResolvedValue([]);
    mockPrisma.calendarEvent.count.mockResolvedValue(0);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import("@/app/api/calendar/events/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/events"));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns empty events list with pagination when no filters", async () => {
    const { GET } = await import("@/app/api/calendar/events/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/events"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toEqual([]);
    expect(body.pagination).toEqual({ page: 1, total: 0, pages: 0 });
  });

  it("passes search params as filters to Prisma", async () => {
    mockPrisma.calendarEvent.findMany.mockResolvedValue([
      { id: "evt-1", title: "Test Event", startDate: new Date("2026-07-15") },
    ]);
    mockPrisma.calendarEvent.count.mockResolvedValue(1);

    const { GET } = await import("@/app/api/calendar/events/route");
    const url = "http://localhost:3000/api/calendar/events?startDate=2026-07-01&endDate=2026-07-31&eventType=MEETING&status=SCHEDULED&search=test&page=1&limit=10";
    const res = await GET(mockRequest(url));

    expect(res.status).toBe(200);

    // Verify Prisma was called with the right filters
    const findManyCall = mockPrisma.calendarEvent.findMany.mock.calls[0][0];
    expect(findManyCall.where.startDate).toEqual({ gte: new Date("2026-07-01") });
    expect(findManyCall.where.endDate).toEqual({ lte: new Date("2026-07-31") });
    expect(findManyCall.where.eventType).toBe("MEETING");
    expect(findManyCall.where.status).toBe("SCHEDULED");
    expect(findManyCall.where.OR).toBeDefined();
    expect(findManyCall.skip).toBe(0);
    expect(findManyCall.take).toBe(10);
  });

  it("clamps page to minimum of 1", async () => {
    const { GET } = await import("@/app/api/calendar/events/route");
    await GET(mockRequest("http://localhost:3000/api/calendar/events?page=0"));

    const call = mockPrisma.calendarEvent.findMany.mock.calls[0][0];
    expect(call.skip).toBe(0);
  });

  it("clamps limit to maximum of 100", async () => {
    const { GET } = await import("@/app/api/calendar/events/route");
    await GET(mockRequest("http://localhost:3000/api/calendar/events?limit=999"));

    const call = mockPrisma.calendarEvent.findMany.mock.calls[0][0];
    expect(call.take).toBe(100);
  });

  it("returns 500 and captures error when Prisma throws", async () => {
    mockPrisma.calendarEvent.findMany.mockRejectedValue(new Error("DB down"));

    const { GET } = await import("@/app/api/calendar/events/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/events"));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch events");
    expect(mockCaptureError).toHaveBeenCalled();
  });
});

describe("POST /api/calendar/events", () => {
  const validBody = {
    title: "Test Event",
    startDate: "2026-07-15T10:00:00Z",
    endDate: "2026-07-15T11:00:00Z",
    eventType: "MEETING",
    color: "#3b82f6",
  };

  const mockCreatedEvent = {
    id: "event-1",
    title: "Test Event",
    description: null,
    startDate: new Date("2026-07-15T10:00:00Z"),
    endDate: new Date("2026-07-15T11:00:00Z"),
    startTime: null,
    endTime: null,
    allDay: false,
    location: null,
    link: null,
    color: "#3b82f6",
    eventType: "MEETING",
    status: "SCHEDULED",
    priority: "MEDIUM",
    notes: null,
    attachments: null,
    recurring: null,
    recurrenceId: null,
    metadata: null,
    appointmentId: null,
    meetingTypeId: null,
    taskId: null,
    reminderId: null,
    createdAt: new Date("2026-07-14T12:00:00Z"),
    updatedAt: new Date("2026-07-14T12:00:00Z"),
  };

  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
    mockPrisma.calendarEvent.create.mockResolvedValue(mockCreatedEvent);
    mockExportEvent.mockResolvedValue(null); // no Google export by default
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { POST } = await import("@/app/api/calendar/events/route");
    const res = await POST(mockJsonResponse(validBody));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 201 and creates an event with valid data", async () => {
    const { POST } = await import("@/app/api/calendar/events/route");
    const res = await POST(mockJsonResponse(validBody));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.event.id).toBe("event-1");
    expect(body.event.title).toBe("Test Event");

    // Verify Prisma was called with correct fields
    expect(mockPrisma.calendarEvent.create).toHaveBeenCalledTimes(1);
    const createData = mockPrisma.calendarEvent.create.mock.calls[0][0].data;
    expect(createData.title).toBe("Test Event");
    expect(createData.eventType).toBe("MEETING");
  });

  it("returns 400 when validation fails", async () => {
    const { POST } = await import("@/app/api/calendar/events/route");
    const res = await POST(mockJsonResponse({})); // missing required fields

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
    expect(mockPrisma.calendarEvent.create).not.toHaveBeenCalled();
  });

  it("returns 400 when title is empty", async () => {
    const { POST } = await import("@/app/api/calendar/events/route");
    const res = await POST(mockJsonResponse({ ...validBody, title: "" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("exports event to Google Calendar and stores googleEventId", async () => {
    mockExportEvent.mockResolvedValue("google-evt-1");
    mockPrisma.calendarEvent.update.mockResolvedValue({
      ...mockCreatedEvent,
      metadata: { googleEventId: "google-evt-1" },
    });

    const { POST } = await import("@/app/api/calendar/events/route");
    const res = await POST(mockJsonResponse(validBody));

    expect(res.status).toBe(201);

    // exportEvent called with the created event
    expect(mockExportEvent).toHaveBeenCalledWith({
      ...mockCreatedEvent,
      metadata: null,
    });

    // googleEventId stored in metadata
    expect(mockPrisma.calendarEvent.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: { metadata: { googleEventId: "google-evt-1" } },
    });
  });

  it("does not store metadata when googleEventId is null", async () => {
    mockExportEvent.mockResolvedValue(null);

    const { POST } = await import("@/app/api/calendar/events/route");
    const res = await POST(mockJsonResponse(validBody));

    expect(res.status).toBe(201);
    expect(mockPrisma.calendarEvent.update).not.toHaveBeenCalled();
  });

  it("returns 500 and captures error when creation fails", async () => {
    mockPrisma.calendarEvent.create.mockRejectedValue(new Error("Create failed"));

    const { POST } = await import("@/app/api/calendar/events/route");
    const res = await POST(mockJsonResponse(validBody));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create event");
    expect(mockCaptureError).toHaveBeenCalled();
  });
});

// ─── events/[id]/route.ts ────────────────────────────────────────────────────

describe("GET /api/calendar/events/[id]", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import("@/app/api/calendar/events/[id]/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/events/test-id"), {
      params: Promise.resolve({ id: "test-id" }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when event not found", async () => {
    mockPrisma.calendarEvent.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/calendar/events/[id]/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/events/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("returns event when found", async () => {
    const mockEvent = { id: "evt-1", title: "My Event", startDate: new Date("2026-07-15") };
    mockPrisma.calendarEvent.findUnique.mockResolvedValue(mockEvent);

    const { GET } = await import("@/app/api/calendar/events/[id]/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/events/evt-1"), {
      params: Promise.resolve({ id: "evt-1" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.event.id).toBe("evt-1");
    expect(body.event.title).toBe("My Event");
  });

  it("returns 500 on error", async () => {
    mockPrisma.calendarEvent.findUnique.mockRejectedValue(new Error("DB error"));

    const { GET } = await import("@/app/api/calendar/events/[id]/route");
    const res = await GET(mockRequest("http://localhost:3000/api/calendar/events/evt-1"), {
      params: Promise.resolve({ id: "evt-1" }),
    });

    expect(res.status).toBe(500);
    expect(mockCaptureError).toHaveBeenCalled();
  });
});

describe("PUT /api/calendar/events/[id]", () => {
  const mockExisting = {
    id: "evt-1",
    title: "Original",
    description: null,
    startDate: new Date("2026-07-15T10:00:00Z"),
    endDate: null,
    startTime: null,
    endTime: null,
    allDay: false,
    location: null,
    link: null,
    color: "#3b82f6",
    eventType: "MEETING",
    status: "SCHEDULED",
    priority: "MEDIUM",
    notes: null,
    attachments: null,
    recurring: null,
    recurrenceId: null,
    metadata: null,
    appointmentId: null,
    meetingTypeId: null,
    taskId: null,
    reminderId: null,
    createdAt: new Date("2026-07-14T12:00:00Z"),
    updatedAt: new Date("2026-07-14T12:00:00Z"),
  };

  const mockUpdated = {
    ...mockExisting,
    title: "Updated Event",
    startDate: new Date("2026-07-16T14:00:00Z"),
  };

  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
    mockPrisma.calendarEvent.findUnique.mockResolvedValue(mockExisting);
    mockPrisma.calendarEvent.update.mockResolvedValue(mockUpdated);
    mockExportEvent.mockResolvedValue(null);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/calendar/events/[id]/route");
    const res = await PUT(
      new Request("http://localhost:3000/api/calendar/events/evt-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid input", async () => {
    const { PUT } = await import("@/app/api/calendar/events/[id]/route");
    const res = await PUT(
      new Request("http://localhost:3000/api/calendar/events/evt-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "INVALID" }),
      }),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(res.status).toBe(400);
    expect(mockPrisma.calendarEvent.update).not.toHaveBeenCalled();
  });

  it("updates event and re-exports to Google Calendar", async () => {
    const { PUT } = await import("@/app/api/calendar/events/[id]/route");
    const res = await PUT(
      new Request("http://localhost:3000/api/calendar/events/evt-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Event" }),
      }),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.event.title).toBe("Updated Event");

    // Verify Prisma update called
    expect(mockPrisma.calendarEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "evt-1" },
        data: expect.objectContaining({ title: "Updated Event" }),
      })
    );

    // Verify Google export re-exported
    expect(mockExportEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "evt-1",
        title: "Updated Event",
        metadata: {},
      })
    );
  });

  it("re-exports with existing googleEventId when metadata exists", async () => {
    const existingWithGoogleMeta = {
      ...mockExisting,
      metadata: { googleEventId: "existing-google-id" },
    };
    mockPrisma.calendarEvent.findUnique.mockResolvedValue(existingWithGoogleMeta);

    const { PUT } = await import("@/app/api/calendar/events/[id]/route");
    await PUT(
      new Request("http://localhost:3000/api/calendar/events/evt-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(mockExportEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ googleEventId: "existing-google-id" }),
      })
    );
  });

  it("returns 500 on error", async () => {
    mockPrisma.calendarEvent.update.mockRejectedValue(new Error("Update failed"));

    const { PUT } = await import("@/app/api/calendar/events/[id]/route");
    const res = await PUT(
      new Request("http://localhost:3000/api/calendar/events/evt-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(res.status).toBe(500);
    expect(mockCaptureError).toHaveBeenCalled();
  });
});

describe("DELETE /api/calendar/events/[id]", () => {
  const mockExisting = {
    id: "evt-1",
    title: "Event to Delete",
    metadata: { googleEventId: "google-evt-to-delete" },
  };

  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1" } });
    mockPrisma.calendarEvent.findUnique.mockResolvedValue(mockExisting);
    mockPrisma.calendarEvent.delete.mockResolvedValue(mockExisting);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/calendar/events/[id]/route");
    const res = await DELETE(
      mockRequest("http://localhost:3000/api/calendar/events/evt-1"),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(res.status).toBe(401);
  });

  it("deletes the event and calls deleteEvent on Google Calendar", async () => {
    const { DELETE } = await import("@/app/api/calendar/events/[id]/route");
    const res = await DELETE(
      mockRequest("http://localhost:3000/api/calendar/events/evt-1"),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    expect(mockPrisma.calendarEvent.delete).toHaveBeenCalledWith({
      where: { id: "evt-1" },
    });

    // Should have called deleteEvent for the Google event
    expect(mockDeleteEvent).toHaveBeenCalledWith("google-evt-to-delete");
  });

  it("does not call deleteEvent if no googleEventId in metadata", async () => {
    mockPrisma.calendarEvent.findUnique.mockResolvedValue({
      ...mockExisting,
      metadata: null,
    });

    const { DELETE } = await import("@/app/api/calendar/events/[id]/route");
    await DELETE(
      mockRequest("http://localhost:3000/api/calendar/events/evt-1"),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(mockDeleteEvent).not.toHaveBeenCalled();
  });

  it("does not throw if deleteEvent fails (fire-and-forget)", async () => {
    mockDeleteEvent.mockRejectedValue(new Error("Google API error"));

    const { DELETE } = await import("@/app/api/calendar/events/[id]/route");
    const res = await DELETE(
      mockRequest("http://localhost:3000/api/calendar/events/evt-1"),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    // The fire-and-forget catch should prevent the route from failing
    expect(res.status).toBe(200);
  });

  it("returns 500 on error", async () => {
    mockPrisma.calendarEvent.delete.mockRejectedValue(new Error("Delete failed"));

    const { DELETE } = await import("@/app/api/calendar/events/[id]/route");
    const res = await DELETE(
      mockRequest("http://localhost:3000/api/calendar/events/evt-1"),
      { params: Promise.resolve({ id: "evt-1" })    }
  );

    expect(res.status).toBe(500);
    expect(mockCaptureError).toHaveBeenCalled();
  });
});
