import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { checkRateLimit, defaultRateLimit, validateOrigin, rateLimitFromRequest } from "@/lib/security";

describe("validateOrigin", () => {
  it("allows requests without origin or referer", () => {
    const req = new NextRequest("http://localhost:3000/api/test");
    expect(validateOrigin(req)).toBe(true);
  });

  it("allows known origins", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { origin: "https://emmettanthony.dev" },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("allows localhost origins", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { origin: "http://localhost:5173" },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("rejects unknown origins", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { origin: "https://evil.com" },
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it("validates via referer when origin missing", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { referer: "https://emmettanthony.dev/some-page" },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("rejects invalid URL in origin/referer", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { origin: "not-a-url" },
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it("allows www subdomain", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { origin: "https://www.emmettanthony.dev" },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("rejects origin that matches hostname but not origin", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { origin: "https://emmettanthony.dev.evil.com" },
    });
    expect(validateOrigin(req)).toBe(false);
  });
});

describe("rateLimitFromRequest", () => {
  it("rate limits by IP from x-forwarded-for", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    const result = rateLimitFromRequest(req);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("rate limits by IP from x-real-ip", () => {
    const req = new NextRequest("http://localhost:3000/api/test", {
      headers: { "x-real-ip": "5.6.7.8" },
    });
    const result = rateLimitFromRequest(req);
    expect(result.allowed).toBe(true);
  });

  it("uses 'unknown' when no IP headers", () => {
    const req = new NextRequest("http://localhost:3000/api/test");
    const result = rateLimitFromRequest(req);
    expect(result.allowed).toBe(true);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows first request", () => {
    const result = checkRateLimit("test-key", { maxRequests: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows requests within limit", () => {
    const key = `within-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, { maxRequests: 5, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests exceeding limit", () => {
    const key = `exceed-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, { maxRequests: 5, windowMs: 60_000 });
    }
    const result = checkRateLimit(key, { maxRequests: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = `reset-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, { maxRequests: 5, windowMs: 10 });
    }

    const blocked = checkRateLimit(key, { maxRequests: 5, windowMs: 10 });
    expect(blocked.allowed).toBe(false);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, { maxRequests: 5, windowMs: 10 });
        expect(result.allowed).toBe(true);
        resolve();
      }, 15);
    });
  });

  it("uses default config when not provided", () => {
    const result = checkRateLimit(`default-${Date.now()}`);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(defaultRateLimit.maxRequests - 1);
  });

  it("handles concurrent unique keys independently", () => {
    const key1 = `key1-${Date.now()}`;
    const key2 = `key2-${Date.now()}`;

    for (let i = 0; i < 10; i++) {
      checkRateLimit(key1, { maxRequests: 10, windowMs: 60_000 });
    }

    expect(checkRateLimit(key1, { maxRequests: 10, windowMs: 60_000 }).allowed).toBe(false);
    expect(checkRateLimit(key2, { maxRequests: 10, windowMs: 60_000 }).allowed).toBe(true);
  });

  it("triggers cleanup after interval and removes expired entries", async () => {
    vi.useFakeTimers();
    const key = `cleanup-${Date.now()}`;

    checkRateLimit(key, { maxRequests: 5, windowMs: 10 });

    vi.advanceTimersByTime(61000);

    const result = checkRateLimit(key, { maxRequests: 5, windowMs: 10 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);

    vi.useRealTimers();
  });
});
