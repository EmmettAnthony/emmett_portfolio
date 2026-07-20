import { describe, it, expect, vi, beforeEach } from "vitest";

interface ActivityLogEntry {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  entity: string | null;
  entityId: string | null;
  description: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: Date;
}

const LOGGED_ACTIONS = new Set<string>();
const LOGGED_MODULES = new Set<string>();

const mockDb = {
  activityLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: mockDb }));

async function logActivity(params: {
  userId?: string;
  action: string;
  module: string;
  entity?: string;
  entityId?: string;
  description: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  metadata?: Record<string, unknown>;
  ip?: string;
}): Promise<ActivityLogEntry> {
  LOGGED_ACTIONS.add(params.action);
  LOGGED_MODULES.add(params.module);

  const entry = await mockDb.activityLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      module: params.module,
      entity: params.entity ?? null,
      entityId: params.entityId ?? null,
      description: params.description,
      severity: params.severity ?? "INFO",
      metadata: params.metadata ?? null,
      ip: params.ip ?? null,
    },
  });
  return entry;
}

async function getActivityLogs(options?: {
  userId?: string;
  module?: string;
  action?: string;
  limit?: number;
  severity?: string;
}): Promise<ActivityLogEntry[]> {
  const where: Record<string, unknown> = {};
  if (options?.userId) where.userId = options.userId;
  if (options?.module) where.module = options.module;
  if (options?.action) where.action = options.action;
  if (options?.severity) where.severity = options.severity;

  return mockDb.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });
}

describe("Activity Log", () => {
  const mockEntry: ActivityLogEntry = {
    id: "log-1",
    userId: "user-1",
    action: "create",
    module: "invoice",
    entity: "Invoice",
    entityId: "inv-1",
    description: "Created invoice INV-001",
    severity: "INFO",
    metadata: { amount: 500 },
    ip: "192.168.1.1",
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logActivity", () => {
    it("logs invoice creation", async () => {
      mockDb.activityLog.create.mockResolvedValue(mockEntry);

      const entry = await logActivity({
        userId: "user-1",
        action: "create",
        module: "invoice",
        entity: "Invoice",
        entityId: "inv-1",
        description: "Created invoice INV-001",
        metadata: { amount: 500 },
        ip: "192.168.1.1",
      });

      expect(entry.action).toBe("create");
      expect(entry.module).toBe("invoice");
      expect(mockDb.activityLog.create).toHaveBeenCalledOnce();
    });

    it("logs authentication events", async () => {
      mockDb.activityLog.create.mockResolvedValue({ ...mockEntry, action: "login", module: "auth" });

      await logActivity({
        userId: "user-1",
        action: "login",
        module: "auth",
        description: "User logged in successfully",
      });

      expect(mockDb.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: "login", module: "auth" }),
        }),
      );
    });

    it("logs security events as WARNING", async () => {
      mockDb.activityLog.create.mockResolvedValue({ ...mockEntry, severity: "WARNING" });

      await logActivity({
        userId: "user-1",
        action: "failed_login",
        module: "auth",
        description: "Failed login attempt from 10.0.0.1",
        severity: "WARNING",
        ip: "10.0.0.1",
      });

      const callArg = mockDb.activityLog.create.mock.calls[0][0];
      expect(callArg.data.severity).toBe("WARNING");
    });
  });

  describe("getActivityLogs", () => {
    it("returns logs with filters", async () => {
      mockDb.activityLog.findMany.mockResolvedValue([mockEntry]);
      const logs = await getActivityLogs({ module: "invoice", limit: 10 });
      expect(logs).toHaveLength(1);
    });

    it("filters by userId", async () => {
      mockDb.activityLog.findMany.mockResolvedValue([]);
      await getActivityLogs({ userId: "user-1" });

      expect(mockDb.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-1" }),
        }),
      );
    });

    it("filters by severity", async () => {
      mockDb.activityLog.findMany.mockResolvedValue([]);
      await getActivityLogs({ severity: "WARNING" });

      expect(mockDb.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ severity: "WARNING" }),
        }),
      );
    });
  });
});
