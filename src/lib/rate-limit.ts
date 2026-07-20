/**
 * Rate limiting utility with Upstash Redis support and in-memory fallback.
 *
 * In production, install @upstash/redis + @upstash/ratelimit and set
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN env vars for
 * persistent, distributed rate limiting across Vercel serverless executions.
 *
 * Without those env vars, falls back to an in-memory store (resets on
 * every cold start / deploy — sufficient for low-traffic use).
 */

import { NextResponse } from "next/server";
import { captureError } from "@/lib/sentry";

// ─── In-Memory Store (fallback) ──────────────────────────────────────────────
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(key: string, maxRequests: number, windowMs: number): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1, reset: now + windowMs };
  }
  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }
  entry.count++;
  return { success: true, remaining: maxRequests - entry.count, reset: entry.resetAt };
}

// Clean up stale in-memory entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore) {
      if (now > entry.resetAt) inMemoryStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * Check if a request should be rate limited.
 *
 * Uses Upstash Redis with a per-route limiter when available (respects the
 * caller's maxRequests/windowMs parameters), falls back to in-memory store
 * when Redis is not configured.
 *
 * Returns an object with `success` (boolean) + rate limit headers.
 * When `success` is false, the caller should return 429.
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  // Try Upstash Redis first (production, distributed)
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      // Dynamic import so builds don't fail when package isn't installed
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");

      const redis = new Redis({ url, token });
      // Create a per-call limiter honoring the caller's maxRequests/windowMs
      const rl = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs / 1000} s`),
        prefix: `ratelimit:${key}`,
      });

      const result = await rl.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      captureError(error, `Upstash rate limit failed for key: ${key}`);
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback (development / no Redis configured)
  return inMemoryRateLimit(key, maxRequests, windowMs);
}

// ─── Helper for API routes: returns 429 response or null ────────────────────
export async function checkRateLimit(
  request: Request,
  prefix: string,
  maxRequests = 5,
  windowMs = 60_000,
): Promise<{ passed: boolean; response?: NextResponse }> {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const result = await rateLimit(`${prefix}:${ip}`, maxRequests, windowMs);

  if (!result.success) {
    return {
      passed: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": "0",
          },
        },
      ),
    };
  }

  return { passed: true };
}
