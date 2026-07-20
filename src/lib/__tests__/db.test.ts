import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaInstance = vi.hoisted(() => ({
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}));

const MockPrismaClient = vi.hoisted(() => vi.fn(function() { return mockPrismaInstance; }));

vi.mock("@prisma/client", () => ({
  PrismaClient: MockPrismaClient,
}));

const MockPrismaPg = vi.hoisted(() => vi.fn());

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: MockPrismaPg,
}));

beforeEach(() => {
  MockPrismaClient.mockClear();
  MockPrismaPg.mockClear();
  vi.resetModules();
  delete (globalThis as any).prisma;
  delete process.env.DATABASE_URL;
});

describe("getPrisma", () => {
  it("returns existing prisma instance if already set on global", async () => {
    (globalThis as any).prisma = mockPrismaInstance;
    const { getPrisma } = await import("../db");
    expect(getPrisma()).toBe(mockPrismaInstance);
    const { PrismaClient } = await import("@prisma/client");
    expect(PrismaClient).not.toHaveBeenCalled();
  });

  it("creates new PrismaClient when DATABASE_URL is set and no existing instance", async () => {
    process.env.DATABASE_URL = "postgresql://localhost/mydb";
    const { getPrisma } = await import("../db");
    const instance = getPrisma();
    expect(instance).toBe(mockPrismaInstance);
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    expect(PrismaClient).toHaveBeenCalledTimes(1);
    expect(PrismaPg).toHaveBeenCalledWith({ connectionString: "postgresql://localhost/mydb" });
  });

  it("throws when DATABASE_URL is not set", async () => {
    const { getPrisma } = await import("../db");
    expect(() => getPrisma()).toThrow(
      "DATABASE_URL is not set. Set it in .env.local to enable database features."
    );
  });

  it("returns same instance on subsequent calls (singleton)", async () => {
    process.env.DATABASE_URL = "postgresql://localhost/mydb";
    const { getPrisma } = await import("../db");
    const instance1 = getPrisma();
    const instance2 = getPrisma();
    expect(instance1).toBe(instance2);
    const { PrismaClient } = await import("@prisma/client");
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });
});

describe("prisma proxy", () => {
  it("forwards property access to getPrisma()", async () => {
    process.env.DATABASE_URL = "postgresql://localhost/mydb";
    const { prisma } = await import("../db");
    expect(prisma.$connect).toBe(mockPrismaInstance.$connect);
    const { PrismaClient } = await import("@prisma/client");
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });
});
