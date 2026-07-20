import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent } from "../analytics";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  delete (globalThis.window as any).gtag;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackEvent", () => {
  it("calls fetch with correct URL, method, headers, and body", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    await trackEvent("test_event");
    expect(fetchMock).toHaveBeenCalledWith("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "test_event" }),
    });
  });

  it("includes label and metadata when provided", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    await trackEvent("test_event", "test_label", { key: "val" });
    expect(fetchMock).toHaveBeenCalledWith("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "test_event",
        label: "test_label",
        metadata: { key: "val" },
      }),
    });
  });

  it("handles fetch rejection gracefully", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    await expect(trackEvent("test_event")).resolves.toBeUndefined();
  });

  it("calls gtag when window.gtag exists", async () => {
    const gtag = vi.fn();
    (globalThis.window as any).gtag = gtag;
    await trackEvent("test_event");
    expect(gtag).toHaveBeenCalledWith("event", "test_event", {
      event_category: "engagement",
    });
  });

  it("includes event_label and metadata in gtag call", async () => {
    const gtag = vi.fn();
    (globalThis.window as any).gtag = gtag;
    await trackEvent("test_event", "test_label", { key: "val" });
    expect(gtag).toHaveBeenCalledWith("event", "test_event", {
      event_category: "engagement",
      event_label: "test_label",
      key: "val",
    });
  });

  it("handles gtag errors gracefully", async () => {
    const gtag = vi.fn().mockImplementation(() => {
      throw new Error("gtag error");
    });
    (globalThis.window as any).gtag = gtag;
    await expect(trackEvent("test_event")).resolves.toBeUndefined();
  });

  it("does not call gtag when gtag is not on window", async () => {
    await expect(trackEvent("test_event")).resolves.toBeUndefined();
    expect((globalThis.window as any).gtag).toBeUndefined();
  });

  it("does not access window when not in browser", async () => {
    vi.stubGlobal("window", undefined);
    const fetchMock = vi.mocked(globalThis.fetch);
    await trackEvent("test_event");
    expect(fetchMock).toHaveBeenCalledWith("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "test_event" }),
    });
  });

  it("works without label and metadata", async () => {
    const gtag = vi.fn();
    (globalThis.window as any).gtag = gtag;
    const fetchMock = vi.mocked(globalThis.fetch);
    await trackEvent("test_event");
    expect(fetchMock).toHaveBeenCalledWith("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "test_event" }),
    });
    expect(gtag).toHaveBeenCalledWith("event", "test_event", {
      event_category: "engagement",
    });
  });
});
