import { describe, it, expect } from "vitest";
import { generateApiKey, hasPermission } from "../api-key";

describe("generateApiKey", () => {
  it("generates a key with nl_ prefix", () => {
    const key = generateApiKey();
    expect(key.raw.startsWith("nl_")).toBe(true);
  });

  it("generates unique keys each time", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.raw).not.toBe(key2.raw);
  });

  it("generates different hash from raw key", () => {
    const key = generateApiKey();
    expect(key.hash).not.toBe(key.raw);
    expect(key.hash.length).toBe(64);
  });

  it("prefix matches first 8 chars of raw key", () => {
    const key = generateApiKey();
    expect(key.prefix).toBe(key.raw.slice(0, 8));
  });
});

describe("hasPermission", () => {
  it("admin can do anything", () => {
    expect(hasPermission("read", "admin")).toBe(true);
    expect(hasPermission("write", "admin")).toBe(true);
  });

  it("write can read and write", () => {
    expect(hasPermission("read", "write")).toBe(true);
    expect(hasPermission("write", "write")).toBe(true);
  });

  it("read can only read", () => {
    expect(hasPermission("read", "read")).toBe(true);
    expect(hasPermission("write", "read")).toBe(false);
  });
});
