import { describe, it, expect, vi, beforeEach } from "vitest";

describe("verifyTurnstile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it("returns true when TURNSTILE_SECRET_KEY is not set", async () => {
    const { verifyTurnstile } = await import("../turnstile");
    const result = await verifyTurnstile("some-token");
    expect(result).toBe(true);
  });

  it("returns true when secret starts with 1x000000000000000000", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x00000000000000000000000000000000";
    const { verifyTurnstile } = await import("../turnstile");
    const result = await verifyTurnstile("some-token");
    expect(result).toBe(true);
  });

  it("returns true when Cloudflare returns success=true", async () => {
    process.env.TURNSTILE_SECRET_KEY = "real-secret-key";
    const mockFetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { verifyTurnstile } = await import("../turnstile");
    const result = await verifyTurnstile("valid-token");
    expect(result).toBe(true);
  });

  it("returns false when Cloudflare returns success=false", async () => {
    process.env.TURNSTILE_SECRET_KEY = "real-secret-key";
    const mockFetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: false }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { verifyTurnstile } = await import("../turnstile");
    const result = await verifyTurnstile("invalid-token");
    expect(result).toBe(false);
  });

  it("returns false when fetch throws", async () => {
    process.env.TURNSTILE_SECRET_KEY = "real-secret-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const { verifyTurnstile } = await import("../turnstile");
    const result = await verifyTurnstile("token");
    expect(result).toBe(false);
  });

  it("passes secret and token to Cloudflare API", async () => {
    process.env.TURNSTILE_SECRET_KEY = "my-secret";
    const mockJson = vi.fn().mockResolvedValue({ success: true });
    const mockFetch = vi.fn().mockResolvedValue({ json: mockJson });
    vi.stubGlobal("fetch", mockFetch);

    const { verifyTurnstile } = await import("../turnstile");
    await verifyTurnstile("my-token");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: expect.any(URLSearchParams),
      },
    );
    const body = mockFetch.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("secret")).toBe("my-secret");
    expect(body.get("response")).toBe("my-token");
  });
});
