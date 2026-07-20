// ──────────────────────────────────────────────────────────────────────────────
// Shared String Guard & Formatting Utilities
// ──────────────────────────────────────────────────────────────────────────────
// Consolidates null-guard, empty-string guard, HTML escaping, and time formatting
// patterns used across email templates and route handlers.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Escape HTML special characters in a string.
 * Handles &, <, >, and " to prevent XSS in generated HTML.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML-escape a value if truthy, otherwise return null.
 * Use this for optional fields that should be omitted entirely when empty.
 */
export function safe(v: string | undefined | null): string | null {
  return v ? escapeHtml(v) : null;
}

/**
 * Return null for falsy values (null, undefined, empty string).
 * Use this for optional fields where the raw (unescaped) value is needed
 * or the value comes from a trusted source (e.g. pre-formatted dates/times).
 */
export function safeVal(v: string | undefined | null): string | null {
  return v || null;
}

/**
 * Format a time string in 12-hour format, e.g. "14:30" → "2:30 PM".
 * Returns empty string when time is null, undefined, or empty.
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Route-level guard: check if an email can be sent.
 * Returns true only when RESEND_API_KEY is configured AND the email
 * is non-null, non-empty, and not whitespace-only.
 *
 * Consolidates the common pattern:
 *   if (process.env.RESEND_API_KEY && appointment.email) { ... }
 * into:
 *   if (hasRecipient(appointment.email)) { ... }
 */
export function hasRecipient(email: string | null | undefined): boolean {
  return !!process.env.RESEND_API_KEY && !!email?.trim();
}
