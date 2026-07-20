import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

let OLD_ENV: NodeJS.ProcessEnv;

beforeEach(() => {
  OLD_ENV = process.env;
  process.env = { ...OLD_ENV };
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  mockLimit.mockReset();
  mockRatelimit.mockReset();
  mockRatelimit.slidingWindow = vi.fn();
  mockRatelimit.mockImplementation(function () {
    return { limit: mockLimit };
  });
  mockRedis.mockImplementation(function () {
    return {};
  });
});

afterEach(() => {
  process.env = OLD_ENV;
  vi.restoreAllMocks();
});

let keyCounter = 0;

function uniqueKey(): string {
  keyCounter++;
  return `rate-test-${keyCounter}`;
}

describe("rateLimit", () => {
  it("falls back to in-memory when UPSTASH env vars are not set", async () => {
    const { rateLimit } = await import("../rate-limit");
    const result = await rateLimit(uniqueKey(), 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it("falls back to in-memory when Upstash constructor throws", async () => {
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

  it("handles Upstash error and falls back to in-memory with captureError", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token123";
    mockRatelimit.mockImplementation(function () {
      throw new Error("Upstash failure");
    });

    const { captureError } = await import("@/lib/sentry");
    const { rateLimit } = await import("../rate-limit");
    const result = await rateLimit(uniqueKey(), 5, 60_000);

    expect(captureError).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining("Upstash rate limit failed for key:"));
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows request within limit via in-memory", async () => {
    const { rateLimit } = await import("../rate-limit");
    const key = uniqueKey();
    const r1 = await rateLimit(key, 3, 60_000);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await rateLimit(key, 3, 60_000);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("blocks request when limit exceeded via in-memory", async () => {
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

    vi.useRealTimers();
  });

  it("remaining count decreases correctly", async () => {
    const { rateLimit } = await import("../rate-limit");
    const key = uniqueKey();
    const results = await Promise.all([
      rateLimit(key, 3, 60_000),
      rateLimit(key, 3, 60_000),
      rateLimit(key, 3, 60_000),
      rateLimit(key, 3, 60_000),
    ]);
    expect(results[0].remaining).toBe(2);
    expect(results[1].remaining).toBe(1);
    expect(results[2].remaining).toBe(0);
    expect(results[3].success).toBe(false);
  });

  it("uses Ratelimit.slidingWindow with correct parameters", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token123";
    mockLimit.mockResolvedValue({ success: true, remaining: 4, reset: 99999 });

    const { rateLimit } = await import("../rate-limit");
    await rateLimit(uniqueKey(), 5, 60_000);

    expect(mockRatelimit.slidingWindow).toHaveBeenCalledWith(5, "60 s");
    expect(mockRatelimit).toHaveBeenCalledWith(expect.objectContaining({
      limiter: mockRatelimit.slidingWindow(5, "60 s"),
    }));
  });

  it("respects custom windowMs parameter", async () => {
    const { rateLimit } = await import("../rate-limit");
    const key = uniqueKey();
    vi.useFakeTimers();
    await rateLimit(key, 1, 10_000);
    const blocked = await rateLimit(key, 1, 10_000);
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(10_001);
    const allowed = await rateLimit(key, 1, 10_000);
    expect(allowed.success).toBe(true);
    vi.useRealTimers();
  });
});

describe("checkRateLimit", () => {
  it("extracts IP from x-forwarded-for header", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, "prefix", 5, 60_000);

    expect(result.passed).toBe(true);
  });

  it("extracts IP from x-real-ip header when x-forwarded-for missing", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.2" },
    });

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, "prefix", 5, 60_000);

    expect(result.passed).toBe(true);
  });

  it('uses "anonymous" when no IP header found', async () => {
    const request = new Request("https://example.com");

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, "prefix", 5, 60_000);

    expect(result.passed).toBe(true);
  });

  it("returns passed=true with no response when under limit", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, "test", 5, 60_000);

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

  it("429 response includes Retry-After and X-RateLimit headers", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.3" },
    });

    const { checkRateLimit } = await import("../rate-limit");
    const prefix = uniqueKey();
    await checkRateLimit(request, prefix, 2, 60_000);
    await checkRateLimit(request, prefix, 2, 60_000);
    const result = await checkRateLimit(request, prefix, 2, 60_000);

    expect(result.response!.headers.get("Retry-After")).toBeDefined();
    expect(Number(result.response!.headers.get("Retry-After"))).toBeGreaterThanOrEqual(0);
    expect(result.response!.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(result.response!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("429 response body contains error message", async () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "10.0.0.4" },
    });

    const { checkRateLimit } = await import("../rate-limit");
    const prefix = uniqueKey();
    await checkRateLimit(request, prefix, 1, 60_000);
    const result = await checkRateLimit(request, prefix, 1, 60_000);

    const body = await result.response!.json();
    expect(body).toEqual({ error: "Too many requests. Please try again later." });
  });

  it("uses x-forwarded-for over x-real-ip when both present", async () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.1",
        "x-real-ip": "198.51.100.2",
      },
    });

    const { checkRateLimit } = await import("../rate-limit");
    const result = await checkRateLimit(request, uniqueKey(), 1, 60_000);

    expect(result.passed).toBe(true);
  });
});
