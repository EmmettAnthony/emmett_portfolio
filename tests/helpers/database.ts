import { vi } from "vitest";

interface MockPrismaOptions {
  findUnique?: unknown;
  findMany?: unknown[];
  findFirst?: unknown;
  create?: unknown;
  update?: unknown;
  upsert?: unknown;
  delete?: unknown;
  count?: number;
  aggregate?: Record<string, unknown>;
  groupBy?: Record<string, unknown>[];
}

function createMockDelegate(options: MockPrismaOptions = {}) {
  return {
    findUnique: vi.fn().mockResolvedValue(options.findUnique ?? null),
    findMany: vi.fn().mockResolvedValue(options.findMany ?? []),
    findFirst: vi.fn().mockResolvedValue(options.findFirst ?? null),
    create: vi.fn().mockResolvedValue(options.create ?? {}),
    update: vi.fn().mockResolvedValue(options.update ?? {}),
    upsert: vi.fn().mockResolvedValue(options.upsert ?? {}),
    delete: vi.fn().mockResolvedValue(options.delete ?? {}),
    deleteMany: vi.fn().mockResolvedValue({ count: options.count ?? 0 }),
    updateMany: vi.fn().mockResolvedValue({ count: options.count ?? 0 }),
    createMany: vi.fn().mockResolvedValue({ count: options.count ?? 0 }),
    count: vi.fn().mockResolvedValue(options.count ?? 0),
    aggregate: vi.fn().mockResolvedValue(options.aggregate ?? {}),
    groupBy: vi.fn().mockResolvedValue(options.groupBy ?? []),
  };
}

export function createMockPrisma(models: Record<string, MockPrismaOptions> = {}) {
  const delegates: Record<string, ReturnType<typeof createMockDelegate>> = {};
  for (const [model, options] of Object.entries(models)) {
    delegates[model] = createMockDelegate(options);
  }

  return {
    ...delegates,
    $transaction: vi.fn().mockImplementation(async (fn: unknown) => {
      if (typeof fn === "function") {
        return fn(createMockPrisma());
      }
      return fn;
    }),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $on: vi.fn(),
    $use: vi.fn(),
    $extends: vi.fn().mockReturnThis(),
  };
}

export type MockPrismaClient = ReturnType<typeof createMockPrisma>;

export function setupPrismaMock(models: Record<string, MockPrismaOptions> = {}) {
  const mockPrisma = createMockPrisma(models);
  vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
  return mockPrisma;
}

export function resetPrismaMock(mockPrisma: MockPrismaClient) {
  for (const key of Object.keys(mockPrisma)) {
    const value = mockPrisma[key as keyof MockPrismaClient];
    if (typeof value === "object" && value !== null && "findUnique" in value) {
      const delegate = value as ReturnType<typeof createMockDelegate>;
      for (const method of Object.keys(delegate)) {
        delegate[method as keyof typeof delegate].mockReset();
      }
    }
  }
}
