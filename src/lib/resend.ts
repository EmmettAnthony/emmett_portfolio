import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * Lazily initialize the Resend client so it doesn't throw during build
 * when RESEND_API_KEY is not set. Callers must check for null.
 */
export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "RESEND_API_KEY is not set. Set it in .env.local to enable email sending."
      );
    }
    _resend = new Resend(key);
  }
  return _resend;
}

