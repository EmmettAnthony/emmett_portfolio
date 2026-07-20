import { expect } from "vitest";

export function assertOkResponse(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(200);
}

export function assertCreatedResponse(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(201);
}

export function assertNoContentResponse(response: { status: number }) {
  expect(response.status).toBe(204);
}

export function assertBadRequest(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(400);
}

export function assertUnauthorized(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(401);
}

export function assertForbidden(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(403);
}

export function assertNotFound(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(404);
}

export function assertConflict(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(409);
}

export function assertUnprocessable(response: { status: number; body?: unknown }) {
  expect(response.status).toBe(422);
}

export function assertRateLimited(response: { status: number }) {
  expect(response.status).toBe(429);
}

export function assertServerError(response: { status: number }) {
  expect(response.status).toBe(500);
}

export function assertResponseBody(body: unknown, key: string, expected: unknown) {
  if (typeof body === "object" && body !== null) {
    expect((body as Record<string, unknown>)[key]).toEqual(expected);
  }
}

export function assertResponseHasKey(body: unknown, key: string) {
  if (typeof body === "object" && body !== null) {
    expect(body).toHaveProperty(key);
  }
}

export function assertPaginationResponse(
  body: unknown,
  expectedKeys: string[] = ["data", "total", "page", "pageSize", "totalPages"],
) {
  if (typeof body === "object" && body !== null) {
    for (const key of expectedKeys) {
      expect(body).toHaveProperty(key);
    }
  }
}
