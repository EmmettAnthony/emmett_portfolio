import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    apiKey: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateApiKey", () => {
  it("generates a key with nl_ prefix", async () => {
    const { generateApiKey } = await import("../api-key");
    const key = generateApiKey();
    expect(key.raw.startsWith("nl_")).toBe(true);
  });

  it("generates unique keys each time", async () => {
    const { generateApiKey } = await import("../api-key");
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.raw).not.toBe(key2.raw);
  });

  it("generates sha256 hash different from raw key", async () => {
    const { generateApiKey } = await import("../api-key");
    const key = generateApiKey();
    expect(key.hash).not.toBe(key.raw);
    expect(key.hash.length).toBe(64);
  });

  it("prefix matches first 8 chars of raw key", async () => {
    const { generateApiKey } = await import("../api-key");
    const key = generateApiKey();
    expect(key.prefix).toBe(key.raw.slice(0, 8));
  });

  it("hash is deterministic for same raw key", async () => {
    const { generateApiKey } = await import("../api-key");
    const key = generateApiKey();
    const expectedHash = crypto.createHash("sha256").update(key.raw).digest("hex");
    expect(key.hash).toBe(expectedHash);
  });
});

describe("validateApiKey", () => {
  it("returns valid true with permissions when key exists", async () => {
    const rawKey = "nl_testkey123";
    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
    mockFindUnique.mockResolvedValue({ id: "key-1", keyHash: hash, permissions: "write" });
    mockUpdate.mockResolvedValue({});

    const { validateApiKey } = await import("../api-key");
    const result = await validateApiKey(rawKey);

    expect(result.valid).toBe(true);
    expect(result.permissions).toBe("write");
    expect(result.keyId).toBe("key-1");
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { keyHash: hash } });
  });

  it("returns valid false when key not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { validateApiKey } = await import("../api-key");
    const result = await validateApiKey("nl_invalid");

    expect(result.valid).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates lastUsedAt on successful validation", async () => {
    const rawKey = "nl_testkey456";
    const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
    mockFindUnique.mockResolvedValue({ id: "key-2", keyHash: hash, permissions: "read" });
    mockUpdate.mockResolvedValue({});

    const { validateApiKey } = await import("../api-key");
    await validateApiKey(rawKey);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "key-2" },
      data: { lastUsedAt: expect.any(Date) },
    });
  });

  it("returns valid false when prisma throws", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB error"));

    const { validateApiKey } = await import("../api-key");
    const result = await validateApiKey("nl_crash");

    expect(result.valid).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns valid false for empty key", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { validateApiKey } = await import("../api-key");
    const result = await validateApiKey("");

    expect(result.valid).toBe(false);
  });
});

describe("hasPermission", () => {
  it("admin can do anything", async () => {
    const { hasPermission } = await import("../api-key");
    expect(hasPermission("read", "admin")).toBe(true);
    expect(hasPermission("write", "admin")).toBe(true);
    expect(hasPermission("delete", "admin")).toBe(true);
  });

  it("write can read and write", async () => {
    const { hasPermission } = await import("../api-key");
    expect(hasPermission("read", "write")).toBe(true);
    expect(hasPermission("write", "write")).toBe(true);
  });

  it("read cannot write", async () => {
    const { hasPermission } = await import("../api-key");
    expect(hasPermission("read", "read")).toBe(true);
    expect(hasPermission("write", "read")).toBe(false);
  });

  it("returns false for unknown required permission", async () => {
    const { hasPermission } = await import("../api-key");
    expect(hasPermission("delete", "read")).toBe(false);
    expect(hasPermission("delete", "write")).toBe(false);
  });

  it("returns false for unknown actual permission", async () => {
    const { hasPermission } = await import("../api-key");
    expect(hasPermission("read", "unknown")).toBe(false);
  });
});
