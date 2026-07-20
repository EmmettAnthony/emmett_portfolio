import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLogActivity = vi.fn();
const mockCreateSecurityEvent = vi.fn();
const mockCreateNotification = vi.fn();
const mockPrismaUserSessionCreate = vi.fn();
const mockPrismaUserSessionUpdateMany = vi.fn();
const mockPrismaAuditTrailCreate = vi.fn();

vi.mock("@/lib/activity", () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
  createSecurityEvent: (...args: unknown[]) => mockCreateSecurityEvent(...args),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    userSession: {
      create: (...args: unknown[]) => mockPrismaUserSessionCreate(...args),
      updateMany: (...args: unknown[]) => mockPrismaUserSessionUpdateMany(...args),
    },
    auditTrail: {
      create: (...args: unknown[]) => mockPrismaAuditTrailCreate(...args),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockLogActivity.mockResolvedValue({ id: "log-1" });
  mockCreateSecurityEvent.mockResolvedValue({ id: "sec-1" });
  mockCreateNotification.mockResolvedValue({ notificationId: "notif-1", channels: [] });
});

describe("autoLogCreate", () => {
  it("logs a create action", async () => {
    const { autoLogCreate } = await import("@/lib/activity-logger");
    await autoLogCreate("crm", "Lead", "lead-1", "Created lead", "user-1", { source: "web" });

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create", module: "crm", entity: "Lead", entityId: "lead-1", severity: "INFO" })
    );
  });
});

describe("autoLogUpdate", () => {
  it("logs an update action", async () => {
    const { autoLogUpdate } = await import("@/lib/activity-logger");
    await autoLogUpdate("crm", "Lead", "lead-1", "Updated lead");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update", severity: "INFO" })
    );
  });
});

describe("autoLogDelete", () => {
  it("logs a delete action with WARNING severity", async () => {
    const { autoLogDelete } = await import("@/lib/activity-logger");
    await autoLogDelete("crm", "Lead", "lead-1", "Deleted lead");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete", severity: "WARNING" })
    );
  });
});

describe("autoLogAction", () => {
  it("logs a custom action", async () => {
    const { autoLogAction } = await import("@/lib/activity-logger");
    await autoLogAction("export", "crm", "Exported leads", "user-1", "Lead", undefined, "INFO");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "export", module: "crm", severity: "INFO" })
    );
  });
});

describe("autoLogSecurityEvent", () => {
  it("logs security event and activity for WARNING", async () => {
    const { autoLogSecurityEvent } = await import("@/lib/activity-logger");
    await autoLogSecurityEvent("suspicious_activity", "Suspicious login", "WARNING", "user-1", "1.2.3.4", { count: 5 });

    expect(mockCreateSecurityEvent).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("creates notification for CRITICAL severity", async () => {
    const { autoLogSecurityEvent } = await import("@/lib/activity-logger");
    await autoLogSecurityEvent("breach_attempt", "Breach detected", "CRITICAL");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "CRITICAL" })
    );
  });

  it("handles notification creation failure", async () => {
    mockCreateNotification.mockRejectedValue(new Error("Notif failed"));
    const { autoLogSecurityEvent } = await import("@/lib/activity-logger");
    const result = await autoLogSecurityEvent("test", "test", "CRITICAL");
    expect(result).toBe(true);
  });
});

describe("trackUserSession", () => {
  it("creates a user session", async () => {
    mockPrismaUserSessionCreate.mockResolvedValue({});
    const { trackUserSession } = await import("@/lib/activity-logger");
    await trackUserSession("user-1", "token-1", "1.2.3.4", "Chrome");

    expect(mockPrismaUserSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", sessionToken: "token-1" }),
      })
    );
  });

  it("handles creation error", async () => {
    mockPrismaUserSessionCreate.mockRejectedValue(new Error("fail"));
    const { trackUserSession } = await import("@/lib/activity-logger");
    await expect(trackUserSession("user-1", "token-1")).resolves.not.toThrow();
  });
});

describe("endUserSessionTracking", () => {
  it("ends user sessions", async () => {
    mockPrismaUserSessionUpdateMany.mockResolvedValue({ count: 1 });
    const { endUserSessionTracking } = await import("@/lib/activity-logger");
    await endUserSessionTracking("token-1");

    expect(mockPrismaUserSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionToken: "token-1", isActive: true },
        data: expect.objectContaining({ isActive: false }),
      })
    );
  });

  it("handles error", async () => {
    mockPrismaUserSessionUpdateMany.mockRejectedValue(new Error("fail"));
    const { endUserSessionTracking } = await import("@/lib/activity-logger");
    await expect(endUserSessionTracking("token-1")).resolves.not.toThrow();
  });
});

describe("autoLogAuditTrail", () => {
  it("creates an audit trail for create", async () => {
    mockPrismaAuditTrailCreate.mockResolvedValue({});
    const { autoLogAuditTrail } = await import("@/lib/activity-logger");
    await autoLogAuditTrail("Lead", "lead-1", "create", "user-1", undefined, { status: "new" });

    expect(mockPrismaAuditTrailCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: "Lead",
          entityId: "lead-1",
          action: "create",
          description: "Created Lead",
        }),
      })
    );
  });

  it("creates an audit trail for update", async () => {
    mockPrismaAuditTrailCreate.mockResolvedValue({});
    const { autoLogAuditTrail } = await import("@/lib/activity-logger");
    await autoLogAuditTrail("Lead", "lead-1", "update", "user-1", { status: "new" }, { status: "contacted" });

    expect(mockPrismaAuditTrailCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "update",
          description: "Updated Lead",
        }),
      })
    );
  });

  it("creates an audit trail for delete", async () => {
    mockPrismaAuditTrailCreate.mockResolvedValue({});
    const { autoLogAuditTrail } = await import("@/lib/activity-logger");
    await autoLogAuditTrail("Lead", "lead-1", "delete");

    expect(mockPrismaAuditTrailCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "delete",
          description: "Deleted Lead",
        }),
      })
    );
  });

  it("handles error gracefully", async () => {
    mockPrismaAuditTrailCreate.mockRejectedValue(new Error("fail"));
    const { autoLogAuditTrail } = await import("@/lib/activity-logger");
    await expect(autoLogAuditTrail("Lead", "lead-1", "create")).resolves.not.toThrow();
  });
});
