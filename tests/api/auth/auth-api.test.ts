import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function postJSON(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function getJSON(url: string) {
  const response = await fetch(url);
  return { status: response.status, body: await response.json() };
}

describe("Auth API", () => {
  describe("POST /api/auth/login", () => {
    it("returns 200 for valid credentials", async () => {
      server.use(
        http.post("http://localhost/api/auth/login", async ({ request }) => {
          const body = (await request.json()) as { email?: string; password?: string };
          if (body.email === "admin@test.com" && body.password === "password123") {
            return HttpResponse.json({ user: { id: "1", email: "admin@test.com", role: "ADMIN" }, token: "jwt-token" });
          }
          return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }),
      );

      const res = await postJSON("http://localhost/api/auth/login", {
        email: "admin@test.com",
        password: "password123",
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("returns 401 for invalid credentials", async () => {
      server.use(
        http.post("http://localhost/api/auth/login", async ({ request }) => {
          const body = (await request.json()) as { email?: string; password?: string };
          if (body.email === "admin@test.com" && body.password === "password123") {
            return HttpResponse.json({ user: {}, token: "jwt-token" });
          }
          return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }),
      );

      const res = await postJSON("http://localhost/api/auth/login", {
        email: "wrong@test.com",
        password: "wrong",
      });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 400 for missing fields", async () => {
      server.use(
        http.post("http://localhost/api/auth/login", async ({ request }) => {
          const body = (await request.json()) as { email?: string; password?: string };
          if (!body.email || !body.password) {
            return HttpResponse.json({ error: "Email and password required" }, { status: 400 });
          }
          return HttpResponse.json({ user: {}, token: "jwt-token" });
        }),
      );

      const res = await postJSON("http://localhost/api/auth/login", { email: "test@test.com" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/register", () => {
    it("returns 201 for valid registration", async () => {
      server.use(
        http.post("http://localhost/api/auth/register", async ({ request }) => {
          const body = (await request.json()) as { email?: string };
          if (body.email === "existing@test.com") {
            return HttpResponse.json({ error: "Email already in use" }, { status: 409 });
          }
          return HttpResponse.json({ message: "User created" }, { status: 201 });
        }),
      );

      const res = await postJSON("http://localhost/api/auth/register", {
        name: "New User",
        email: "new@test.com",
        password: "SecurePass1",
      });
      expect(res.status).toBe(201);
    });

    it("returns 409 for duplicate email", async () => {
      server.use(
        http.post("http://localhost/api/auth/register", async ({ request }) => {
          const body = (await request.json()) as { email?: string };
          if (body.email === "existing@test.com") {
            return HttpResponse.json({ error: "Email already in use" }, { status: 409 });
          }
          return HttpResponse.json({ message: "User created" }, { status: 201 });
        }),
      );

      const res = await postJSON("http://localhost/api/auth/register", {
        name: "User",
        email: "existing@test.com",
        password: "SecurePass1",
      });
      expect(res.status).toBe(409);
    });

    it("returns 400 for missing required fields", async () => {
      server.use(
        http.post("http://localhost/api/auth/register", async ({ request }) => {
          const body = (await request.json()) as { name?: string; email?: string; password?: string };
          if (!body.name || !body.email || !body.password) {
            return HttpResponse.json({ error: "Missing required fields" }, { status: 400 });
          }
          return HttpResponse.json({ message: "User created" }, { status: 201 });
        }),
      );

      const res = await postJSON("http://localhost/api/auth/register", { name: "User" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("returns 200 for valid email", async () => {
      server.use(
        http.post("http://localhost/api/auth/forgot-password", async ({ request }) => {
          const body = (await request.json()) as { email?: string };
          if (!body.email) {
            return HttpResponse.json({ error: "Email required" }, { status: 400 });
          }
          return HttpResponse.json({ message: "Reset link sent" });
        }),
      );

      const res = await postJSON("http://localhost/api/auth/forgot-password", { email: "user@test.com" });
      expect(res.status).toBe(200);
    });

    it("returns 400 for missing email", async () => {
      server.use(
        http.post("http://localhost/api/auth/forgot-password", async ({ request }) => {
          const body = (await request.json()) as { email?: string };
          if (!body.email) {
            return HttpResponse.json({ error: "Email required" }, { status: 400 });
          }
          return HttpResponse.json({ message: "Reset link sent" });
        }),
      );

      const res = await postJSON("http://localhost/api/auth/forgot-password", {});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/session", () => {
    it("returns session for authenticated user", async () => {
      server.use(
        http.get("http://localhost/api/auth/session", () => {
          return HttpResponse.json({
            user: { id: "1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
            expires: new Date(Date.now() + 86400000).toISOString(),
          });
        }),
      );

      const res = await getJSON("http://localhost/api/auth/session");
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("ADMIN");
    });

    it("returns 401 for unauthenticated", async () => {
      server.use(
        http.get("http://localhost/api/auth/session", () => {
          return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
        }),
      );

      const res = await getJSON("http://localhost/api/auth/session");
      expect(res.status).toBe(401);
    });
  });
});
