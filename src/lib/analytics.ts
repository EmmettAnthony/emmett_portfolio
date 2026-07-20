"use client";

/**
 * Track a custom analytics event.
 * Sends to both the backend DB and Google Analytics (if configured).
 */
export async function trackEvent(
  event: string,
  label?: string,
  metadata?: Record<string, unknown>
) {
  // Backend tracking
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, label, metadata }),
    });
  } catch {
    // Silently fail
  }

  // Google Analytics tracking (GA4)
  if (typeof window !== "undefined" && "gtag" in window) {
    try {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag("event", event, {
          event_category: "engagement",
          event_label: label,
          ...metadata,
        });
      }
    } catch {
      // Silently fail
    }
  }
}
