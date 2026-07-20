/**
 * Core Brevo API fetch wrapper.
 * Handles authentication, request/response formatting, timeout, and error wrapping.
 */

const BREVO_API_URL = "https://api.brevo.com/v3";

interface BrevoConfig {
  apiKey: string;
}

export function getBrevoConfig(): BrevoConfig {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set. Set it in .env.local to enable Brevo integration.");
  }
  return { apiKey };
}

export class BrevoApiError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body = "") {
    super(message);
    this.name = "BrevoApiError";
    this.status = status;
    this.body = body;
  }
}

export async function brevoFetch<T>(
  path: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { apiKey } = getBrevoConfig();
  const url = `${BREVO_API_URL}${path}`;
  const controller = new AbortController();
  const timeout = options.timeout || 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        Accept: "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new BrevoApiError(
        `Brevo API ${options.method || "GET"} ${path} failed: ${response.status}`,
        response.status,
        errorBody
      );
    }

    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof BrevoApiError) throw err;
    throw new BrevoApiError(
      `Brevo API request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
