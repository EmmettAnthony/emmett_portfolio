import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { cache } from "../cache";

describe("InMemoryCache", () => {
  beforeEach(() => {
    cache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves a value", () => {
    cache.set("key1", { foo: "bar" });
    expect(cache.get("key1")).toEqual({ foo: "bar" });
  });

  it("returns null for missing key", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("returns null for expired entry", () => {
    cache.set("key2", "data", 100);
    vi.advanceTimersByTime(101);
    expect(cache.get("key2")).toBeNull();
  });

  it("returns value before expiry", () => {
    cache.set("key3", "data", 1000);
    vi.advanceTimersByTime(500);
    expect(cache.get("key3")).toBe("data");
  });

  it("uses default TTL when not specified", () => {
    cache.set("key4", "data");
    vi.advanceTimersByTime(300001);
    expect(cache.get("key4")).toBeNull();
  });

  it("invalidates entries matching a pattern", () => {
    cache.set("user:1", "alice");
    cache.set("user:2", "bob");
    cache.set("settings", "dark");
    cache.invalidate("user:");
    expect(cache.get("user:1")).toBeNull();
    expect(cache.get("user:2")).toBeNull();
    expect(cache.get("settings")).toBe("dark");
  });

  it("invalidates entries with exact prefix", () => {
    cache.set("abc", "value");
    cache.invalidate("abc");
    expect(cache.get("abc")).toBeNull();
  });

  it("clears all entries", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBeNull();
  });

  it("handles various data types", () => {
    cache.set("num", 42);
    cache.set("bool", true);
    cache.set("arr", [1, 2, 3]);
    cache.set("obj", { nested: { value: "deep" } });
    expect(cache.get("num")).toBe(42);
    expect(cache.get("bool")).toBe(true);
    expect(cache.get("arr")).toEqual([1, 2, 3]);
    expect(cache.get("obj")).toEqual({ nested: { value: "deep" } });
  });
});
