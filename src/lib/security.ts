import { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "https://emmettanthony.dev",
  "https://www.emmettanthony.dev",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5173",
  "http://localhost:5174",
];

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) return true;

  const url = origin || referer || "";
  try {
    const parsed = new URL(url);
    return ALLOWED_ORIGINS.some((allowed) => parsed.origin === allowed || parsed.hostname === "localhost");
  } catch {
    return false;
  }
}

// ─── In-memory rate limiter ───────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const defaultRateLimit: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = defaultRateLimit
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitFromRequest(
  request: NextRequest,
  config?: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  return checkRateLimit(`ip:${ip}`, config);
}
