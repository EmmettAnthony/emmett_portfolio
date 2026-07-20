import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockHeaders = new Map<string, string | null>();

function createMockRequest() {
  return {
    headers: {
      get: (name: string) => mockHeaders.get(name) ?? null,
    },
  };
}

describe("security", () => {
  beforeEach(() => {
    mockHeaders.clear();
  });

  describe("validateOrigin", () => {
    it("returns true when no origin and no referer", async () => {
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(true);
    });

    it("returns true for allowed origin (https://emmettanthony.dev)", async () => {
      mockHeaders.set("origin", "https://emmettanthony.dev");
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(true);
    });

    it("returns true for allowed origin (http://localhost:3000)", async () => {
      mockHeaders.set("origin", "http://localhost:3000");
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(true);
    });

    it("returns false for disallowed origin", async () => {
      mockHeaders.set("origin", "https://evil.com");
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(false);
    });

    it("uses referer when origin is missing", async () => {
      mockHeaders.set("referer", "https://emmettanthony.dev/some-page");
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(true);
    });

    it("prefers origin over referer when both present", async () => {
      mockHeaders.set("origin", "https://evil.com");
      mockHeaders.set("referer", "https://emmettanthony.dev");
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(false);
    });

    it("allows any localhost with hostname check", async () => {
      mockHeaders.set("origin", "http://localhost:9999");
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(true);
    });

    it("returns false for invalid URL (malformed)", async () => {
      mockHeaders.set("origin", ":::invalid:::");
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(false);
    });

    it("returns true for empty string origin (treated as absent)", async () => {
      mockHeaders.set("origin", "");
      const { validateOrigin } = await import("../security");
      expect(validateOrigin(createMockRequest() as any)).toBe(true);
    });
  });

  describe("checkRateLimit", () => {
    beforeEach(async () => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("allows first request with remaining count", async () => {
      const { checkRateLimit } = await import("../security");
      const result = checkRateLimit("test-key");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("decrements remaining on each request", async () => {
      const { checkRateLimit } = await import("../security");
      checkRateLimit("decrement-key");
      const result = checkRateLimit("decrement-key");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(8);
    });

    it("blocks when exceeding max requests", async () => {
      const { checkRateLimit } = await import("../security");
      for (let i = 0; i < 10; i++) {
        checkRateLimit("block-key", { maxRequests: 10, windowMs: 60000 });
      }
      const result = checkRateLimit("block-key", { maxRequests: 10, windowMs: 60000 });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("uses custom config", async () => {
      const { checkRateLimit } = await import("../security");
      expect(checkRateLimit("custom-key", { maxRequests: 3, windowMs: 30000 }).allowed).toBe(true);
      expect(checkRateLimit("custom-key", { maxRequests: 3, windowMs: 30000 }).allowed).toBe(true);
      expect(checkRateLimit("custom-key", { maxRequests: 3, windowMs: 30000 }).allowed).toBe(true);
      const result = checkRateLimit("custom-key", { maxRequests: 3, windowMs: 30000 });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("resets after window expires", async () => {
      const { checkRateLimit } = await import("../security");
      checkRateLimit("expire-key", { maxRequests: 1, windowMs: 1000 });
      expect(checkRateLimit("expire-key", { maxRequests: 1, windowMs: 1000 }).allowed).toBe(false);

      vi.advanceTimersByTime(1001);
      const result = checkRateLimit("expire-key", { maxRequests: 1, windowMs: 1000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it("uses defaultRateLimit when no config passed", async () => {
      const { checkRateLimit, defaultRateLimit } = await import("../security");
      const result = checkRateLimit("default-config-key");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(defaultRateLimit.maxRequests - 1);
    });
  });

  describe("rateLimitFromRequest", () => {
    it("uses x-forwarded-for header", async () => {
      mockHeaders.set("x-forwarded-for", "192.168.1.1, 10.0.0.1");
      const { rateLimitFromRequest } = await import("../security");
      const result = rateLimitFromRequest(createMockRequest() as any);
      expect(result.allowed).toBe(true);
    });

    it("falls back to x-real-ip", async () => {
      mockHeaders.set("x-real-ip", "10.0.0.5");
      const { rateLimitFromRequest } = await import("../security");
      const result = rateLimitFromRequest(createMockRequest() as any);
      expect(result.allowed).toBe(true);
    });

    it("falls back to unknown when no IP headers", async () => {
      const { rateLimitFromRequest } = await import("../security");
      const result = rateLimitFromRequest(createMockRequest() as any);
      expect(result.allowed).toBe(true);
    });

    it("accepts custom config", async () => {
      mockHeaders.set("x-forwarded-for", "10.0.0.1");
      const { rateLimitFromRequest } = await import("../security");
      const result = rateLimitFromRequest(createMockRequest() as any, { maxRequests: 1, windowMs: 60000 });
      expect(result.allowed).toBe(true);
      const result2 = rateLimitFromRequest(createMockRequest() as any, { maxRequests: 1, windowMs: 60000 });
      expect(result2.allowed).toBe(false);
    });

    it("trims IP and splits multi-value x-forwarded-for", async () => {
      mockHeaders.set("x-forwarded-for", "  203.0.113.5, 10.0.0.2  ");
      const { rateLimitFromRequest } = await import("../security");
      const result = rateLimitFromRequest(createMockRequest() as any);
      expect(result.allowed).toBe(true);
    });
  });

  describe("defaultRateLimit", () => {
    it("has correct default values", async () => {
      const { defaultRateLimit } = await import("../security");
      expect(defaultRateLimit.maxRequests).toBe(10);
      expect(defaultRateLimit.windowMs).toBe(60000);
    });
  });
});
