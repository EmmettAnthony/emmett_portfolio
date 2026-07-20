import { geolocation } from "@vercel/functions";
import type { NextRequest } from "next/server";

// ─── In-memory cache ─────────────────────────────────────────────────────
// Avoids repeated API/edge lookups for the same IP within the same request.
const geoCache = new Map<string, string | null>();

const MAX_CACHE_SIZE = 1000;

function cacheResult(ip: string, country: string | null): void {
  if (geoCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    const firstKey = geoCache.keys().next().value;
    if (firstKey !== undefined) geoCache.delete(firstKey);
  }
  geoCache.set(ip, country);
}

// ─── Lookup country from request ────────────────────────────────────────
// Uses Vercel's edge-native geolocation which reads from request headers.
// Returns the ISO 3166-1 alpha-2 country code or null if unavailable.
export function getCountryFromRequest(request: NextRequest): string | null {
  try {
    const geo = geolocation(request);
    return geo?.country || null;
  } catch {
    return null;
  }
}

// ─── Lookup country from IP (fallback / manual) ─────────────────────────
// If you have an IP but no request object, use this.
// Checks cache first, then falls back to ip-api.com (free, no key needed).
export async function getCountryFromIp(ip: string): Promise<string | null> {
  if (!ip) return null;

  // Check cache
  const cached = geoCache.get(ip);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      cacheResult(ip, null);
      return null;
    }
    const data = (await res.json()) as { countryCode?: string };
    const country = data?.countryCode || null;
    cacheResult(ip, country);
    return country;
  } catch {
    cacheResult(ip, null);
    return null;
  }
}

// ─── Convenience: get country from request OR IP ─────────────────────────
// Tries the request object first (Vercel edge), falls back to IP lookup.
export async function resolveCountry(
  request?: NextRequest,
  ip?: string,
): Promise<string | null> {
  if (request) {
    const country = getCountryFromRequest(request);
    if (country) return country;
  }
  if (ip) {
    return getCountryFromIp(ip);
  }
  return null;
}
