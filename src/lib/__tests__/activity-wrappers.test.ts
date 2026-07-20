import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ─── Hoisted mocks (must be before vi.mock calls) ────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "log-1" }));
const mockGetCountryFromRequest = vi.hoisted(() => vi.fn().mockReturnValue(null));

vi.mock("@/../auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

vi.mock("@/lib/geo", () => ({
  getCountryFromRequest: mockGetCountryFromRequest,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockRequest(url = "http://localhost:3000/api/test", headerOverrides?: Record<string, string>): NextRequest {
  return new NextRequest(url, {
    headers: {
      "user-agent": "Mozilla/5.0 Chrome/120",
      ...(headerOverrides || {}),
    },
  }) as NextRequest;
}

function successHandler(_req: NextRequest, _ctx: { userId: string }) {
  return Promise.resolve(NextResponse.json({ ok: true }));
}

function errorHandler(_req: NextRequest, _ctx: { userId: string }) {
  return Promise.reject(new Error("Handler crashed"));
}

function failingHandler(_req: NextRequest, _ctx: { userId: string }) {
  return Promise.resolve(NextResponse.json({ error: "Bad" }, { status: 400 }));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("withActivityLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "test-user-1" } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Auth check ─────────────────────────────────────────────────────────

  describe("authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "test", "Test action")(successHandler);
      const res = await wrapped(mockRequest());

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
      expect(mockLogActivity).not.toHaveBeenCalled();
    });

    it("returns 401 when session has no user", async () => {
      mockAuth.mockResolvedValue({});

      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "test", "Test action")(successHandler);
      const res = await wrapped(mockRequest());

      expect(res.status).toBe(401);
    });

    it("calls the handler when authenticated", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withActivityLog("create", "test", "Test action")(handler);
      const req = mockRequest();
      await wrapped(req);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(req, { userId: "test-user-1" });
    });
  });

  // ─── Activity logging on success ────────────────────────────────────────

  describe("activity logging on success", () => {
    it("logs the activity with INFO severity on success", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "crm", "Created client")(successHandler);
      await wrapped(mockRequest());

      expect(mockLogActivity).toHaveBeenCalledTimes(1);
      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "create",
          module: "crm",
          description: "Created client",
          severity: "INFO",
          userId: "test-user-1",
        }),
      );
    });

    it("logs with ERROR severity when handler returns >= 400", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "crm", "Created client")(failingHandler);
      await wrapped(mockRequest());

      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Created client (failed)",
          severity: "ERROR",
        }),
      );
    });

    it("includes IP and user-agent from the request", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "crm", "Test")(successHandler);
      const req = mockRequest("http://localhost:3000/api/test", {
        "user-agent": "Mozilla/5.0 Firefox/121",
        "x-forwarded-for": "203.0.113.42",
      });
      await wrapped(req);

      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: "203.0.113.42",
          userAgent: "Mozilla/5.0 Firefox/121",
        }),
      );
    });

    it("includes country from geo lookup", async () => {
      mockGetCountryFromRequest.mockReturnValue("US");

      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "crm", "Test")(successHandler);
      await wrapped(mockRequest());

      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({ country: "US" }),
      );
    });
  });

  // ─── Description as function ────────────────────────────────────────────

  describe("description as function", () => {
    it("accepts a function that receives the request", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const descFn = vi.fn((req: NextRequest) => `Action on ${req.url}`);
      const wrapped = withActivityLog("update", "crm", descFn)(successHandler);
      const req = mockRequest("http://localhost:3000/api/test/123");
      await wrapped(req);

      expect(descFn).toHaveBeenCalledWith(req);
      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({ description: "Action on http://localhost:3000/api/test/123" }),
      );
    });
  });

  // ─── Activity logging on error ──────────────────────────────────────────

  describe("activity logging on handler error (throw)", () => {
    it("logs with _error action and ERROR severity when handler throws", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "crm", "Create client")(errorHandler);

      // The wrapper re-throws, so we expect it to throw
      await expect(wrapped(mockRequest())).rejects.toThrow("Handler crashed");

      expect(mockLogActivity).toHaveBeenCalledTimes(1);
      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "create_error",
          description: "Create client: Handler crashed",
          severity: "ERROR",
        }),
      );
    });

    it("includes request metadata in error log", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "crm", "Test")(errorHandler);
      const req = mockRequest("http://localhost:3000/api/test", {
        "x-forwarded-for": "198.51.100.1",
      });
      await expect(wrapped(req)).rejects.toThrow();

      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: "198.51.100.1",
          userAgent: "Mozilla/5.0 Chrome/120",
        }),
      );
    });
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles non-Error thrown values gracefully", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const throwsString = (_req: NextRequest, _ctx: { userId: string }) =>
        Promise.reject("string error");
      const wrapped = withActivityLog("create", "test", "Test")(throwsString);

      await expect(wrapped(mockRequest())).rejects.toBe("string error");

      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Test: Unknown error",
        }),
      );
    });

    it("handles missing user-agent header", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "test", "Test")(successHandler);
      const req = new NextRequest("http://localhost:3000/api/test") as NextRequest;
      // Remove user-agent which NextRequest sets by default
      vi.spyOn(req.headers, "get").mockImplementation((key: string) => {
        if (key === "user-agent") return null;
        if (key === "x-forwarded-for") return null;
        if (key === "x-real-ip") return null;
        return null;
      });
      await wrapped(req);

      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: undefined,
          userAgent: undefined,
        }),
      );
    });

    it("resolves the handler response correctly", async () => {
      const { withActivityLog } = await import("@/lib/activity-wrappers");
      const wrapped = withActivityLog("create", "test", "Test")(successHandler);
      const res = await wrapped(mockRequest());

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(res.status).toBe(200);
    });
  });
});
