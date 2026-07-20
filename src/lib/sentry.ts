/**
 * Server-side Sentry error tracking for API routes.
 *
 * Usage:
 *   import { captureError } from "@/lib/sentry";
 *   catch (error) {
 *     captureError(error, "Failed to do something");
 *     ...
 *   }
 */

let sentryClient: typeof import("@sentry/nextjs") | null = null;

function getSentry() {
  if (sentryClient) return sentryClient;
  try {
    // Dynamic import so build-time doesn't fail without DSN
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const imported: typeof import("@sentry/nextjs") = require("@sentry/nextjs");
    sentryClient = imported;
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (dsn && !imported.isInitialized()) {
      imported.init({
        dsn,
        environment: process.env.NODE_ENV || "production",
        tracesSampleRate: 0.1,
      });
    }
    return imported;
  } catch {
    // Sentry not available – no-op
    return null;
  }
}

/**
 * Capture an error in Sentry with a descriptive message prefix.
 * Falls back to console.error if Sentry is not configured.
 */
export function captureError(error: unknown, message: string): void {
  const sentry = getSentry();

  if (sentry && process.env.SENTRY_DSN) {
    sentry.captureException(error, {
      extra: { message },
    });
  }

  // Always log to console as a fallback
  console.error(message, error);
}
