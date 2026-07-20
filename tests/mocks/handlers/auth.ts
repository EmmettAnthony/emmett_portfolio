import { http, HttpResponse } from "msw";

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return HttpResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        user: { id: "1", name: "Test User", email: "test@example.com", role: "ADMIN" },
        token: "mock-jwt-token",
      });
    }
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string; name?: string };
    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json({ error: "Name, email, and password required" }, { status: 400 });
    }
    if (body.email === "existing@example.com") {
      return HttpResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    return HttpResponse.json({ message: "Registration successful" }, { status: 201 });
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({ message: "Logged out" });
  }),

  http.post("/api/auth/forgot-password", async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email) {
      return HttpResponse.json({ error: "Email required" }, { status: 400 });
    }
    return HttpResponse.json({ message: "Reset link sent if email exists" });
  }),

  http.post("/api/auth/reset-password", async ({ request }) => {
    const body = (await request.json()) as { token?: string; password?: string };
    if (!body.token || !body.password) {
      return HttpResponse.json({ error: "Token and password required" }, { status: 400 });
    }
    if (body.password.length < 8) {
      return HttpResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });
    }
    return HttpResponse.json({ message: "Password reset successful" });
  }),

  http.get("/api/auth/session", () => {
    return HttpResponse.json({
      user: { id: "1", name: "Test User", email: "test@example.com", role: "ADMIN" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
  }),

  http.get("/api/auth/session/expired", () => {
    return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
  }),
];
