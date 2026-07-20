import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockHash = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());

vi.mock("bcryptjs", () => ({ default: { hash: mockHash }, hash: mockHash }));

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(() => ({
    user: {
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
  })),
}));

function asNextRequest(body: Record<string, unknown>): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when token is missing", async () => {
    const { POST } = await import("../route");
    const res = await POST(asNextRequest({ password: "newpassword123" }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Token and password are required");
  });

  it("returns 400 when password is missing", async () => {
    const { POST } = await import("../route");
    const res = await POST(asNextRequest({ token: "some-token" }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Token and password are required");
  });

  it("returns 400 when password is too short", async () => {
    const { POST } = await import("../route");
    const res = await POST(asNextRequest({ token: "some-token", password: "123" }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Password must be at least 8 characters");
  });

  it("returns 400 when token is invalid or expired", async () => {
    mockFindFirst.mockResolvedValue(null);
    const { POST } = await import("../route");
    const res = await POST(asNextRequest({ token: "bad-token", password: "newpassword123" }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid or expired reset token");
  });

  it("returns 200 on successful password reset", async () => {
    mockFindFirst.mockResolvedValue({ id: "user-1", email: "test@example.com" });
    mockHash.mockResolvedValue("hashed-password");
    mockUpdate.mockResolvedValue({});

    const { POST } = await import("../route");
    const res = await POST(asNextRequest({ token: "valid-token", password: "newpassword123" }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.message).toBe("Password has been reset successfully.");
    expect(mockHash).toHaveBeenCalledWith("newpassword123", 12);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        password: "hashed-password",
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  });

  it("returns 500 on unexpected error", async () => {
    mockFindFirst.mockRejectedValue(new Error("DB error"));
    const { POST } = await import("../route");
    const res = await POST(asNextRequest({ token: "valid-token", password: "newpassword123" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Internal server error");
  });
});
