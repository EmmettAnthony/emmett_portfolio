import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    webhook: {
      findMany: mockFindMany,
    },
  },
}));

const mockCreateHmac = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDigest = vi.hoisted(() => vi.fn());

vi.mock("crypto", () => ({
  default: {
    createHmac: mockCreateHmac,
  },
  createHmac: mockCreateHmac,
}));

const mockFetch = vi.hoisted(() => vi.fn());

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mockFetch);
  vi.stubGlobal("console", { ...console, error: vi.fn() });
});

import { dispatchWebhook } from "@/lib/webhooks";

describe("dispatchWebhook", () => {
  it("fetches active webhooks matching event from DB", async () => {
    mockFindMany.mockResolvedValue([]);
    mockFetch.mockResolvedValue({ ok: true });
    await dispatchWebhook("contact.form_submitted", { name: "Test" });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { active: true, events: { contains: "contact.form_submitted" } },
    });
  });

  it("dispatches POST request to webhook URL with correct headers and body", async () => {
    const webhookUrl = "https://hook.example.com/endpoint";
    mockFindMany.mockResolvedValue([
      { id: "wh_1", url: webhookUrl, secret: null, active: true, events: "contact.form_submitted" },
    ]);
    mockFetch.mockResolvedValue({ ok: true });
    await dispatchWebhook("contact.form_submitted", { name: "Test User" });
    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe(webhookUrl);
    expect(call[1].method).toBe("POST");
    expect(call[1].headers["Content-Type"]).toBe("application/json");
    expect(call[1].headers["User-Agent"]).toBe("NewsletterWebhook/1.0");
    const parsedBody = JSON.parse(call[1].body);
    expect(parsedBody.event).toBe("contact.form_submitted");
    expect(parsedBody.timestamp).toBeDefined();
    expect(parsedBody.data).toEqual({ name: "Test User" });
  });

  it("includes signature header when webhook has a secret", async () => {
    const mockHmac = { update: mockUpdate, digest: mockDigest };
    mockCreateHmac.mockReturnValue(mockHmac);
    mockDigest.mockReturnValue("signed_hex_digest");
    mockFindMany.mockResolvedValue([
      { id: "wh_1", url: "https://hook.example.com", secret: "my_secret", active: true, events: "event" },
    ]);
    mockFetch.mockResolvedValue({ ok: true });
    await dispatchWebhook("event", { key: "value" });
    expect(mockCreateHmac).toHaveBeenCalledWith("sha256", "my_secret");
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockDigest).toHaveBeenCalledWith("hex");
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["X-Webhook-Signature"]).toBe("signed_hex_digest");
  });

  it("does not include signature header when webhook has no secret", async () => {
    mockFindMany.mockResolvedValue([
      { id: "wh_1", url: "https://hook.example.com", secret: null, active: true, events: "event" },
    ]);
    mockFetch.mockResolvedValue({ ok: true });
    await dispatchWebhook("event", { key: "value" });
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["X-Webhook-Signature"]).toBeUndefined();
    expect(mockCreateHmac).not.toHaveBeenCalled();
  });

  it("dispatches to multiple webhooks", async () => {
    mockFindMany.mockResolvedValue([
      { id: "wh_1", url: "https://hook1.example.com", secret: null, active: true, events: "event" },
      { id: "wh_2", url: "https://hook2.example.com", secret: null, active: true, events: "event" },
    ]);
    mockFetch.mockResolvedValue({ ok: true });
    await dispatchWebhook("event", {});
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe("https://hook1.example.com");
    expect(mockFetch.mock.calls[1][0]).toBe("https://hook2.example.com");
  });

  it("handles fetch rejection gracefully (console.error, doesn't throw)", async () => {
    mockFindMany.mockResolvedValue([
      { id: "wh_1", url: "https://hook.example.com", secret: null, active: true, events: "event" },
    ]);
    mockFetch.mockRejectedValue(new Error("Network error"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(dispatchWebhook("event", {})).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to dispatch webhook wh_1 to https://hook.example.com:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it("handles prisma error gracefully (console.error, doesn't throw)", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(dispatchWebhook("event", {})).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to dispatch webhooks:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it("handles no matching webhooks (no fetch calls)", async () => {
    mockFindMany.mockResolvedValue([]);
    await dispatchWebhook("event", { key: "value" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("body includes event, timestamp, and data", async () => {
    mockFindMany.mockResolvedValue([
      { id: "wh_1", url: "https://hook.example.com", secret: null, active: true, events: "event" },
    ]);
    mockFetch.mockResolvedValue({ ok: true });
    await dispatchWebhook("test.event", { foo: "bar" });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toHaveProperty("event", "test.event");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("data", { foo: "bar" });
  });

  it("calls crypto.createHmac with correct algorithm and secret", async () => {
    const mockHmac = { update: mockUpdate, digest: mockDigest };
    mockCreateHmac.mockReturnValue(mockHmac);
    mockDigest.mockReturnValue("abc123");
    mockFindMany.mockResolvedValue([
      { id: "wh_1", url: "https://hook.example.com", secret: "supersecret", active: true, events: "event" },
    ]);
    mockFetch.mockResolvedValue({ ok: true });
    await dispatchWebhook("event", {});
    expect(mockCreateHmac).toHaveBeenCalledWith("sha256", "supersecret");
    expect(mockUpdate).toHaveBeenCalledWith(mockFetch.mock.calls[0][1].body);
    expect(mockDigest).toHaveBeenCalledWith("hex");
  });

  it("does not throw when fetch rejects for multiple webhooks", async () => {
    mockFindMany.mockResolvedValue([
      { id: "wh_1", url: "https://hook1.example.com", secret: null, active: true, events: "event" },
      { id: "wh_2", url: "https://hook2.example.com", secret: null, active: true, events: "event" },
    ]);
    mockFetch.mockRejectedValue(new Error("Timeout"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(dispatchWebhook("event", {})).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    consoleErrorSpy.mockRestore();
  });
});
