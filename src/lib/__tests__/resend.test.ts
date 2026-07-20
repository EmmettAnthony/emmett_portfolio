import { describe, it, expect, vi, beforeEach } from "vitest";

const MockResend = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: MockResend,
}));

beforeEach(() => {
  vi.resetModules();
  MockResend.mockClear();
  delete process.env.RESEND_API_KEY;
});

describe("getResend", () => {
  it("creates a new Resend instance when RESEND_API_KEY is set", async () => {
    process.env.RESEND_API_KEY = "re_123456";
    const { getResend } = await import("../resend");
    const instance = getResend();
    expect(MockResend).toHaveBeenCalledWith("re_123456");
    expect(instance).toBeDefined();
  });

  it("throws when RESEND_API_KEY is not set", async () => {
    const { getResend } = await import("../resend");
    expect(() => getResend()).toThrow(
      "RESEND_API_KEY is not set. Set it in .env.local to enable email sending."
    );
  });

  it("returns same instance on subsequent calls (singleton)", async () => {
    process.env.RESEND_API_KEY = "re_123456";
    const { getResend } = await import("../resend");
    const instance1 = getResend();
    const instance2 = getResend();
    expect(instance1).toBe(instance2);
    expect(MockResend).toHaveBeenCalledTimes(1);
  });
});
