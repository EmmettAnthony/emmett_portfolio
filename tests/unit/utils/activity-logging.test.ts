import { describe, it, expect } from "vitest";

type ActivitySeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface ActivityEntry {
  userId: string;
  action: string;
  module: string;
  entity?: string;
  entityId?: string;
  description: string;
  severity: ActivitySeverity;
  metadata?: Record<string, unknown>;
  ip?: string;
  timestamp: Date;
}

interface ActivityLogConfig {
  enabled: boolean;
  logLevel: ActivitySeverity;
  sensitiveModules: string[];
  sensitiveActions: string[];
}

const DEFAULT_CONFIG: ActivityLogConfig = {
  enabled: true,
  logLevel: "INFO",
  sensitiveModules: ["auth", "security", "settings"],
  sensitiveActions: ["delete", "refund", "password_reset"],
};

function shouldLogAction(
  config: ActivityLogConfig,
  action: string,
  module: string,
  severity: ActivitySeverity,
): boolean {
  if (!config.enabled) return false;

  const severityLevels: ActivitySeverity[] = ["INFO", "WARNING", "ERROR", "CRITICAL"];
  const configLevelIndex = severityLevels.indexOf(config.logLevel);
  const actionLevelIndex = severityLevels.indexOf(severity);

  return actionLevelIndex >= configLevelIndex;
}

function maskSensitiveData(
  entry: ActivityEntry,
  config: ActivityLogConfig,
): ActivityEntry {
  if (
    config.sensitiveModules.includes(entry.module) ||
    config.sensitiveActions.includes(entry.action)
  ) {
    return {
      ...entry,
      metadata: undefined,
      ip: entry.ip ? entry.ip.replace(/\d+/g, "***") : undefined,
    };
  }
  return entry;
}

function createActivityEntry(
  userId: string,
  action: string,
  module: string,
  description: string,
  options?: {
    entity?: string;
    entityId?: string;
    severity?: ActivitySeverity;
    metadata?: Record<string, unknown>;
    ip?: string;
  },
): ActivityEntry {
  return {
    userId,
    action,
    module,
    description,
    severity: options?.severity ?? "INFO",
    entity: options?.entity,
    entityId: options?.entityId,
    metadata: options?.metadata,
    ip: options?.ip,
    timestamp: new Date(),
  };
}

describe("Activity Logging", () => {
  describe("shouldLogAction", () => {
    it("logs when severity meets threshold", () => {
      expect(shouldLogAction(DEFAULT_CONFIG, "view", "crm", "INFO")).toBe(true);
    });

    it("logs warnings and above when threshold is WARNING", () => {
      const config = { ...DEFAULT_CONFIG, logLevel: "WARNING" as ActivitySeverity };
      expect(shouldLogAction(config, "delete", "crm", "WARNING")).toBe(true);
      expect(shouldLogAction(config, "view", "crm", "INFO")).toBe(false);
    });

    it("logs nothing when disabled", () => {
      expect(shouldLogAction({ ...DEFAULT_CONFIG, enabled: false }, "delete", "crm", "CRITICAL")).toBe(false);
    });
  });

  describe("maskSensitiveData", () => {
    it("masks metadata for sensitive modules", () => {
      const entry = createActivityEntry("user-1", "login", "auth", "User logged in", {
        metadata: { password: "secret123" },
        ip: "192.168.1.1",
      });
      const masked = maskSensitiveData(entry, DEFAULT_CONFIG);
      expect(masked.metadata).toBeUndefined();
      expect(masked.ip).not.toContain("192");
    });

    it("does not mask non-sensitive actions", () => {
      const entry = createActivityEntry("user-1", "view", "crm", "Viewed invoice", {
        metadata: { invoiceId: "inv-1" },
      });
      const masked = maskSensitiveData(entry, DEFAULT_CONFIG);
      expect(masked.metadata).toEqual({ invoiceId: "inv-1" });
    });
  });

  describe("createActivityEntry", () => {
    it("creates entry with required fields", () => {
      const entry = createActivityEntry("user-1", "create", "invoice", "Created invoice INV-001");
      expect(entry.userId).toBe("user-1");
      expect(entry.action).toBe("create");
      expect(entry.module).toBe("invoice");
      expect(entry.severity).toBe("INFO");
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it("includes optional fields", () => {
      const entry = createActivityEntry("user-1", "delete", "crm", "Deleted lead", {
        entity: "Lead",
        entityId: "lead-1",
        severity: "WARNING",
        metadata: { reason: "Duplicate" },
        ip: "10.0.0.1",
      });
      expect(entry.entity).toBe("Lead");
      expect(entry.entityId).toBe("lead-1");
      expect(entry.severity).toBe("WARNING");
      expect(entry.metadata).toEqual({ reason: "Duplicate" });
    });
  });
});
