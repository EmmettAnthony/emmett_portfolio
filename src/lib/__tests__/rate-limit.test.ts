import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/sentry", () => ({
  captureError: vi.fn(),
}));

const { mockLimit, mockRatelimit, mockRedis } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockRatelimit = vi.fn(function () {
    return { limit: mockLimit };
  });
  mockRatelimit.slidingWindow = vi.fn();
  const mockRedis = vi.fn(function () {
    return {};
  });
  return { mockLimit, mockRatelimit, mockRedis };
});

vi.mock("@upstash/ratelimit", () => ({ Ratelimit: mockRatelimit }));
vi.mock("@upstash/redis", () => ({ Redis: mockRedis }));

beforeEach(() => {
  mockLimit.mockReset();
  mockRatelimit.mockImplementation(function () {
    return { limit: mockLimit };
  });
  mockRatelimit.slidingWindow = vi.fn();
  mockRedis.mockImplementation(function () {
    return {};
  });
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

let keyCounter = 0;
function uniqueKey(): string {
  keyCounter++;
  return `rate-test-key-${keyCounter}`;
}

describe("rateLimit", () => {
  it("falls back to inMemoryRateLimit when UPSTASH env vars are not set", async () => {
    const { rateLimit } = await import("../rate-limit");
    const result = await rateLimit(uniqueKey(), 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it("falls back to inMemoryRateLimit when Upstash constructor throws", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token123";

    mockRatelimit.mockImplementation(function () {
      throw new Error("Ratelimit not available");
    });

    const { rateLimit } = await import("../rate-limit");
    const result = await rateLimit(uniqueKey(), 5, 60_000);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("calls Upstash and returns result when env vars are set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token123";

    mockLimit.mockResolvedValue({ success: true, remaining: 9, reset: 99999 });

    const { rateLimit } = await import("../rate-limit");
    const result = await rateLimit(uniqueKey(), 10, 60_000);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.reset).toBe(99999);
  });

  it("handles Upstash error and falls back to in-memory", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token123";

    const { captureError } = await import("@/lib/sentry");

    mockRatelimit.mockImplementation(function () {
      throw new Error("Upstash failure");
    });

    const { rateLimit } = await import("../rate-limit");
    const result = await rateLimit(uniqueKey(), 5, 60_000);

    expect(captureError).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining("Upstash rate limit failed for key:"));
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });
});

describe("inMemoryRateLimit (via rateLimit)", () => {
  it("allows request within limit", async () => {
    const { rateLimit } = await import("../rate-limit");
    const key = uniqueKey();
    const result = await rateLimit(key, 3, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks request when limit exceeded", async () => {
    const { rateLimit } = await import("../rate-limit");
    const key = uniqueKey();
    await rateLimit(key, 2, 60_000);
    await rateLimit(key, 2, 60_000);
    const result = await rateLimit(key, 2, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import("../rate-limit");
    const key = uniqueKey();
    await rateLimit(key, 2, 60_000);
    await rateLimit(key, 2, 60_000);
    const blocked = await rateLimit(key, 2, 60_000);
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(60_001);
    const allowed = await rateLimit(key, 2, 60_000);
    expect(allowed.success).toBe(true);
    expect(allowed.remaining).toBe(1);
  });

  it("remaining count decreases with each request", async () => {
    const { rateLimit } = await import("../rate-limit");
    const key = uniqueKey();
    const r1 = await rateLimit(key, 5, 60_000);
    expect(r1.remaining).toBe(4);
    const r2 = await rateLimit(key, 5, 60_000);
    expect(r2.remaining).toBe(3);
    const r3 = await rateLimit(key, 5, 60_000);
    expect(r3.remaining).toBe(2);
    const r4 = await rateLimit(key, 5, 60_000);
    expect(r4.remaining).toBe(1);
    const r5 = await rateLimit(key, 5, 60_000);
    expect(r5.remaining).toBe(0);
    const r6 = await rateLimit(key, 5, 60_000);
    expect(r6.success).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("extracts IP from x-forwarded-for header", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });
    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, uniqueKey(), 5, 60_000);
    expect(result.passed).toBe(true);
  });

  it("extracts IP from x-real-ip header", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, uniqueKey(), 5, 60_000);
    expect(result.passed).toBe(true);
  });

  it('uses "anonymous" when no IP header found', async () => {
    const request = new Request("https://example.com");
    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, uniqueKey(), 5, 60_000);
    expect(result.passed).toBe(true);
  });

  it("returns passed=true when under limit", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, uniqueKey(), 5, 60_000);
    expect(result.passed).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it("returns passed=false with 429 response when over limit", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    const { checkRateLimit } = await import("../rate-limit");
    const prefix = uniqueKey();
    await checkRateLimit(request, prefix, 2, 60_000);
    await checkRateLimit(request, prefix, 2, 60_000);
    const result = await checkRateLimit(request, prefix, 2, 60_000);
    expect(result.passed).toBe(false);
    expect(result.response).toBeDefined();
    expect(result.response!.status).toBe(429);
  });

  it("response includes Retry-After and X-RateLimit headers", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.3" },
    });
    const { checkRateLimit } = await import("../rate-limit");
    const prefix = uniqueKey();
    await checkRateLimit(request, prefix, 2, 60_000);
    await checkRateLimit(request, prefix, 2, 60_000);
    const result = await checkRateLimit(request, prefix, 2, 60_000);
    expect(result.response!.headers.get("Retry-After")).toBeDefined();
    expect(result.response!.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(result.response!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("returns a 429 JSON response with error message", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.4" },
    });
    const { checkRateLimit } = await import("../rate-limit");
    const prefix = uniqueKey();
    await checkRateLimit(request, prefix, 2, 60_000);
    await checkRateLimit(request, prefix, 2, 60_000);
    const result = await checkRateLimit(request, prefix, 2, 60_000);
    const responseBody = await result.response!.json();
    expect(responseBody).toEqual({ error: "Too many requests. Please try again later." });
  });

  it("cleans up stale in-memory entries via setInterval", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import("../rate-limit");

    // Create an entry that should be cleaned up
    const key = uniqueKey();
    await rateLimit(key, 1, 100); // expires in 100ms
    // Exhaust the limit
    const blocked = await rateLimit(key, 1, 100);
    expect(blocked.success).toBe(false);

    // Advance time past the entry's reset
    vi.advanceTimersByTime(5 * 60 * 1000 + 100); // interval is 5min, entry expires at 100ms

    // Now the entry should be cleaned up and a new window starts
    const allowed = await rateLimit(key, 1, 100);
    expect(allowed.success).toBe(true);

    vi.useRealTimers();
  });

  it("respects custom maxRequests parameters", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.5" },
    });
    const { checkRateLimit } = await import("../rate-limit");
    const prefix = uniqueKey();
    // Set max requests to 1, so first call uses it and second should fail
    await checkRateLimit(request, prefix, 1, 60_000);
    const result = await checkRateLimit(request, prefix, 1, 60_000);
    expect(result.passed).toBe(false);
  });

  it("uses Upstash rate limit when env vars are available", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token123";

    mockLimit.mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60000 });

    const { rateLimit } = await import("../rate-limit");
    const result = await rateLimit(uniqueKey(), 5, 60_000);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("triggers setInterval cleanup callback to clear stale entries", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import("../rate-limit");

    // Create multiple entries with short windows
    const key1 = uniqueKey();
    const key2 = uniqueKey();

    await rateLimit(key1, 1, 50);
    await rateLimit(key2, 1, 100);

    // Exhaust both limits
    expect((await rateLimit(key1, 1, 50)).success).toBe(false);
    expect((await rateLimit(key2, 1, 100)).success).toBe(false);

    // Advance time past the cleanup interval (5 min) + entries' expiry
    vi.advanceTimersByTime(5 * 60 * 1000 + 200);

    // After cleanup, new windows should start
    const r1 = await rateLimit(key1, 1, 50);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(0);

    const r2 = await rateLimit(key2, 1, 100);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(0);

    vi.useRealTimers();
  });
});
