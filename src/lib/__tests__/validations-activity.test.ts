import { describe, it, expect } from "vitest";
import {
  activityLogFilterSchema,
  createActivityLogSchema,
  createAuditTrailSchema,
  auditTrailFilterSchema,
  createSecurityEventSchema,
  securityEventFilterSchema,
  activityAnalyticsSchema,
} from "../validations/activity";

describe("activityLogFilterSchema", () => {
  it("parses with defaults", () => {
    const result = activityLogFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sort).toBe("newest");
  });

  it("parses with all fields", () => {
    const result = activityLogFilterSchema.parse({
      search: "test",
      module: "CRM",
      action: "create",
      severity: "ERROR",
      userId: "user_1",
      entity: "Lead",
      entityId: "lead_1",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      page: 2,
      limit: 50,
      sort: "oldest",
    });
    expect(result.module).toBe("CRM");
    expect(result.severity).toBe("ERROR");
    expect(result.sort).toBe("oldest");
  });

  it("rejects invalid sort", () => {
    const result = activityLogFilterSchema.safeParse({ sort: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects negative page", () => {
    const result = activityLogFilterSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects limit over 100", () => {
    const result = activityLogFilterSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });
});

describe("createActivityLogSchema", () => {
  it("parses valid activity log", () => {
    const result = createActivityLogSchema.parse({
      action: "CREATE_LEAD",
      module: "CRM",
      description: "Created a new lead",
    });
    expect(result.action).toBe("CREATE_LEAD");
    expect(result.module).toBe("CRM");
    expect(result.description).toBe("Created a new lead");
    expect(result.severity).toBe("INFO");
  });

  it("rejects empty action", () => {
    const result = createActivityLogSchema.safeParse({
      action: "",
      module: "CRM",
      description: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty module", () => {
    const result = createActivityLogSchema.safeParse({
      action: "TEST",
      module: "",
      description: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = createActivityLogSchema.safeParse({
      action: "TEST",
      module: "CRM",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid severity", () => {
    const result = createActivityLogSchema.safeParse({
      action: "TEST",
      module: "CRM",
      description: "Test",
      severity: "UNKNOWN",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = createActivityLogSchema.parse({
      userId: "user_1",
      action: "UPDATE",
      module: "CRM",
      entity: "Lead",
      entityId: "lead_1",
      description: "Updated lead",
      severity: "WARNING",
      metadata: { key: "value" },
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      browser: "Chrome",
      os: "macOS",
      device: "Desktop",
    });
    expect(result.userId).toBe("user_1");
    expect(result.severity).toBe("WARNING");
    expect(result.ip).toBe("192.168.1.1");
    expect(result.browser).toBe("Chrome");
  });
});

describe("createAuditTrailSchema", () => {
  it("parses valid audit trail", () => {
    const result = createAuditTrailSchema.parse({
      entityType: "Lead",
      entityId: "lead_1",
      action: "update",
    });
    expect(result.entityType).toBe("Lead");
    expect(result.entityId).toBe("lead_1");
    expect(result.action).toBe("update");
  });

  it("rejects empty entityType", () => {
    const result = createAuditTrailSchema.safeParse({
      entityType: "",
      entityId: "lead_1",
      action: "update",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty entityId", () => {
    const result = createAuditTrailSchema.safeParse({
      entityType: "Lead",
      entityId: "",
      action: "update",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid action", () => {
    const result = createAuditTrailSchema.safeParse({
      entityType: "Lead",
      entityId: "lead_1",
      action: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = createAuditTrailSchema.parse({
      entityType: "Lead",
      entityId: "lead_1",
      action: "update",
      field: "name",
      beforeValue: "Old",
      afterValue: "New",
      beforeData: { name: "Old" },
      afterData: { name: "New" },
      userId: "user_1",
      description: "Updated name",
    });
    expect(result.field).toBe("name");
    expect(result.beforeValue).toBe("Old");
    expect(result.afterValue).toBe("New");
    expect(result.userId).toBe("user_1");
  });
});

describe("auditTrailFilterSchema", () => {
  it("parses with defaults", () => {
    const result = auditTrailFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
  });

  it("parses with all fields", () => {
    const result = auditTrailFilterSchema.parse({
      entityType: "Lead",
      entityId: "lead_1",
      action: "create",
      userId: "user_1",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      page: 2,
      limit: 30,
    });
    expect(result.action).toBe("create");
    expect(result.userId).toBe("user_1");
    expect(result.limit).toBe(30);
  });

  it("rejects invalid action", () => {
    const result = auditTrailFilterSchema.safeParse({ action: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("createSecurityEventSchema", () => {
  it("parses valid security event", () => {
    const result = createSecurityEventSchema.parse({
      eventType: "LOGIN_FAILED",
      description: "Failed login attempt",
    });
    expect(result.eventType).toBe("LOGIN_FAILED");
    expect(result.description).toBe("Failed login attempt");
    expect(result.severity).toBe("WARNING");
  });

  it("rejects empty eventType", () => {
    const result = createSecurityEventSchema.safeParse({
      eventType: "",
      description: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = createSecurityEventSchema.safeParse({
      eventType: "LOGIN_FAILED",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid severity", () => {
    const result = createSecurityEventSchema.safeParse({
      eventType: "LOGIN_FAILED",
      description: "Test",
      severity: "UNKNOWN",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = createSecurityEventSchema.parse({
      eventType: "LOGIN_FAILED",
      description: "Failed login from unknown IP",
      severity: "ERROR",
      userId: "user_1",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla",
      metadata: { attempts: 5 },
    });
    expect(result.severity).toBe("ERROR");
    expect(result.userId).toBe("user_1");
    expect(result.ipAddress).toBe("192.168.1.1");
  });
});

describe("securityEventFilterSchema", () => {
  it("parses with defaults", () => {
    const result = securityEventFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sort).toBe("newest");
  });

  it("parses with all fields", () => {
    const result = securityEventFilterSchema.parse({
      eventType: "LOGIN_FAILED",
      severity: "ERROR",
      resolved: true,
      userId: "user_1",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      page: 2,
      limit: 50,
      sort: "oldest",
    });
    expect(result.eventType).toBe("LOGIN_FAILED");
    expect(result.resolved).toBe(true);
    expect(result.sort).toBe("oldest");
  });

  it("coerces resolved to boolean", () => {
    const result = securityEventFilterSchema.parse({ resolved: "true" });
    expect(result.resolved).toBe(true);
  });

  it("rejects invalid sort", () => {
    const result = securityEventFilterSchema.safeParse({ sort: "other" });
    expect(result.success).toBe(false);
  });
});

describe("activityAnalyticsSchema", () => {
  it("parses empty object", () => {
    const result = activityAnalyticsSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with all fields", () => {
    const result = activityAnalyticsSchema.parse({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    expect(result.startDate).toBe("2024-01-01");
    expect(result.endDate).toBe("2024-12-31");
  });
});
