import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaActivityLogCreate = vi.hoisted(() => vi.fn());
const mockPrismaActivityLogFindMany = vi.hoisted(() => vi.fn());
const mockPrismaActivityLogCount = vi.hoisted(() => vi.fn());
const mockPrismaActivityLogGroupBy = vi.hoisted(() => vi.fn());
const mockPrismaAuditTrailCreate = vi.hoisted(() => vi.fn());
const mockPrismaAuditTrailFindMany = vi.hoisted(() => vi.fn());
const mockPrismaAuditTrailCount = vi.hoisted(() => vi.fn());
const mockPrismaSecurityEventCreate = vi.hoisted(() => vi.fn());
const mockPrismaSecurityEventFindMany = vi.hoisted(() => vi.fn());
const mockPrismaSecurityEventCount = vi.hoisted(() => vi.fn());
const mockPrismaSecurityEventUpdate = vi.hoisted(() => vi.fn());
const mockPrismaUserSessionCreate = vi.hoisted(() => vi.fn());
const mockPrismaUserSessionUpdate = vi.hoisted(() => vi.fn());
const mockPrismaUserSessionUpdateMany = vi.hoisted(() => vi.fn());
const mockPrismaUserFindMany = vi.hoisted(() => vi.fn());
const mockGetCountryFromIp = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    activityLog: {
      create: mockPrismaActivityLogCreate,
      findMany: mockPrismaActivityLogFindMany,
      count: mockPrismaActivityLogCount,
      groupBy: mockPrismaActivityLogGroupBy,
    },
    auditTrail: {
      create: mockPrismaAuditTrailCreate,
      findMany: mockPrismaAuditTrailFindMany,
      count: mockPrismaAuditTrailCount,
    },
    securityEvent: {
      create: mockPrismaSecurityEventCreate,
      findMany: mockPrismaSecurityEventFindMany,
      count: mockPrismaSecurityEventCount,
      update: mockPrismaSecurityEventUpdate,
    },
    userSession: {
      create: mockPrismaUserSessionCreate,
      update: mockPrismaUserSessionUpdate,
      updateMany: mockPrismaUserSessionUpdateMany,
    },
    user: {
      findMany: mockPrismaUserFindMany,
    },
  },
}));

vi.mock("@/lib/geo", () => ({
  getCountryFromIp: mockGetCountryFromIp,
}));

function mockLog(data: { action?: string; module?: string } = {}) {
  return {
    id: "log-1",
    userId: "user-1",
    action: data.action || "create",
    module: data.module || "crm",
    description: "Test log",
    severity: "INFO",
    createdAt: new Date(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrismaActivityLogCreate.mockResolvedValue(mockLog());
  mockPrismaActivityLogFindMany.mockResolvedValue([mockLog()]);
  mockPrismaActivityLogCount.mockResolvedValue(1);
  mockGetCountryFromIp.mockResolvedValue("US");
});

describe("parseUserAgent", () => {
  it("returns nulls for null UA", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: null as unknown as undefined });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ browser: null, os: null, device: null }),
      })
    );
  });

  it("detects Chrome on Windows", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Mozilla/5.0 Chrome/120.0 Windows NT 10.0" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ browser: "Chrome", os: "Windows", device: "Desktop" }) })
    );
  });

  it("detects Firefox on macOS", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Mozilla/5.0 Firefox/121.0 Mac OS X" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ browser: "Firefox", os: "macOS", device: "Desktop" }) })
    );
  });

  it("detects Safari on iOS", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Mozilla/5.0 iPhone Safari" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ browser: "Safari", os: "iOS", device: "Mobile" }) })
    );
  });

  it("detects Edge", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Mozilla/5.0 Edg/120 Windows" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ browser: "Edge" }) })
    );
  });

  it("detects Opera", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Opera/9.80" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ browser: "Opera" }) })
    );
  });

  it("detects Android Mobile", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Mozilla/5.0 Android Mobile Chrome" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ os: "Android", device: "Mobile" }) })
    );
  });

  it("detects Android Tablet", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Mozilla/5.0 Android Tablet" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ os: "Android", device: "Tablet" }) })
    );
  });

  it("detects iPad", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Mozilla/5.0 iPad" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ os: "iOS", device: "Tablet" }) })
    );
  });

  it("detects Linux", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "Mozilla/5.0 Linux Firefox" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ os: "Linux" }) })
    );
  });

  it("detects generic Mobile device", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "MobileOnly/1.0" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ device: "Mobile" }) })
    );
  });

  it("uses Unknown for unrecognized browser and OS", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", userAgent: "SomeWeirdBrowser/1.0 (CustomOS)" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ browser: "Unknown", os: "Unknown" }) })
    );
  });
});

describe("logActivity", () => {
  it("creates a log entry with all fields", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({
      action: "create",
      module: "crm",
      description: "Created a lead",
      userId: "user-1",
      entity: "Lead",
      entityId: "lead-1",
      severity: "ERROR",
      metadata: { key: "val" },
      ip: "1.2.3.4",
      userAgent: "Chrome/120",
      country: "US",
    });

    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "create",
          module: "crm",
          description: "Created a lead",
          userId: "user-1",
          entity: "Lead",
          entityId: "lead-1",
          severity: "ERROR",
          ip: "1.2.3.4",
          userAgent: "Chrome/120",
          country: "US",
        }),
      })
    );
  });

  it("handles errors gracefully and returns null", async () => {
    mockPrismaActivityLogCreate.mockRejectedValue(new Error("DB error"));
    const { logActivity } = await import("@/lib/activity");
    const result = await logActivity({ action: "test", module: "test", description: "t" });
    expect(result).toBeNull();
  });

  it("resolves country from IP when not provided", async () => {
    mockGetCountryFromIp.mockResolvedValue("GB");
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", ip: "5.5.5.5" });
    expect(mockGetCountryFromIp).toHaveBeenCalledWith("5.5.5.5");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ country: "GB" }) })
    );
  });

  it("handles country resolution failure", async () => {
    mockGetCountryFromIp.mockRejectedValue(new Error("fail"));
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t", ip: "5.5.5.5" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ country: null }) })
    );
  });

  it("handles missing optional fields gracefully", async () => {
    const { logActivity } = await import("@/lib/activity");
    await logActivity({ action: "test", module: "test", description: "t" });
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: null,
          entity: null,
          entityId: null,
          ip: null,
          userAgent: null,
          country: null,
        }),
      })
    );
  });

  it("logs with all severity levels", async () => {
    const { logActivity } = await import("@/lib/activity");
    for (const severity of ["INFO", "WARNING", "ERROR", "CRITICAL"] as const) {
      await logActivity({ action: "test", module: "test", description: "t", severity });
    }
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledTimes(4);
  });
});

describe("convenience functions", () => {
  it("logAuthAction", async () => {
    const { logAuthAction } = await import("@/lib/activity");
    await logAuthAction("login", "User logged in", "user-1", "1.2.3.4", "Chrome");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "login", module: "auth" }) })
    );
  });

  it("logCrmAction", async () => {
    const { logCrmAction } = await import("@/lib/activity");
    await logCrmAction("create", "Lead created", "Lead", "lead-1", "user-1");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "create", module: "crm", entity: "Lead" }) })
    );
  });

  it("logContactAction", async () => {
    const { logContactAction } = await import("@/lib/activity");
    await logContactAction("create", "Contact form submitted");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "create", module: "contact" }) })
    );
  });

  it("logPortfolioAction", async () => {
    const { logPortfolioAction } = await import("@/lib/activity");
    await logPortfolioAction("publish", "Project published", "Project", "proj-1");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "publish", module: "portfolio" }) })
    );
  });

  it("logBlogAction", async () => {
    const { logBlogAction } = await import("@/lib/activity");
    await logBlogAction("create", "Blog post created", "Post", "post-1");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "create", module: "blog" }) })
    );
  });

  it("logNewsletterAction", async () => {
    const { logNewsletterAction } = await import("@/lib/activity");
    await logNewsletterAction("send", "Campaign sent");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "send", module: "newsletter" }) })
    );
  });

  it("logCalendarAction", async () => {
    const { logCalendarAction } = await import("@/lib/activity");
    await logCalendarAction("book", "Meeting booked");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "book", module: "calendar" }) })
    );
  });

  it("logPaymentAction", async () => {
    const { logPaymentAction } = await import("@/lib/activity");
    await logPaymentAction("receive", "Payment received");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "receive", module: "payment" }) })
    );
  });

  it("logFileAction", async () => {
    const { logFileAction } = await import("@/lib/activity");
    await logFileAction("upload", "File uploaded");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "upload", module: "file" }) })
    );
  });

  it("logSystemAction", async () => {
    const { logSystemAction } = await import("@/lib/activity");
    await logSystemAction("backup", "Backup completed", "WARNING");
    expect(mockPrismaActivityLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "backup", module: "system", severity: "WARNING" }) })
    );
  });
});

describe("getActivityLogs", () => {
  it("returns logs with pagination", async () => {
    mockPrismaActivityLogFindMany.mockResolvedValue([mockLog(), mockLog()]);
    mockPrismaActivityLogCount.mockResolvedValue(10);
    const { getActivityLogs } = await import("@/lib/activity");
    const result = await getActivityLogs({ page: 1, limit: 5 });

    expect(result.logs).toHaveLength(2);
    expect(result.total).toBe(10);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(2);
  });

  it("filters by module, action, severity, userId, entity, entityId", async () => {
    const { getActivityLogs } = await import("@/lib/activity");
    await getActivityLogs({ module: "crm", action: "create", severity: "INFO", userId: "user-1", entity: "Lead", entityId: "lead-1" });

    expect(mockPrismaActivityLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ module: "crm", action: "create", severity: "INFO", userId: "user-1", entity: "Lead", entityId: "lead-1" }),
      })
    );
  });

  it("filters by date range", async () => {
    const { getActivityLogs } = await import("@/lib/activity");
    await getActivityLogs({ startDate: "2024-01-01", endDate: "2024-12-31" });

    expect(mockPrismaActivityLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
        }),
      })
    );
  });

  it("filters by startDate only", async () => {
    const { getActivityLogs } = await import("@/lib/activity");
    await getActivityLogs({ startDate: "2024-01-01" });

    expect(mockPrismaActivityLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    );
  });

  it("filters by endDate only", async () => {
    const { getActivityLogs } = await import("@/lib/activity");
    await getActivityLogs({ endDate: "2024-12-31" });

    expect(mockPrismaActivityLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      })
    );
  });

  it("filters by search term", async () => {
    const { getActivityLogs } = await import("@/lib/activity");
    await getActivityLogs({ search: "test" });

    expect(mockPrismaActivityLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({ description: expect.objectContaining({ contains: "test" }) }),
              ]),
            }),
          ]),
        }),
      })
    );
  });

  it("sorts oldest first", async () => {
    const { getActivityLogs } = await import("@/lib/activity");
    await getActivityLogs({ sort: "oldest" });

    expect(mockPrismaActivityLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ createdAt: "asc" }] })
    );
  });

  it("uses defaults when no options", async () => {
    const { getActivityLogs } = await import("@/lib/activity");
    await getActivityLogs();

    expect(mockPrismaActivityLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20, orderBy: [{ createdAt: "desc" }] })
    );
  });
});

describe("getActivityAnalytics", () => {
  const baseGroupByResult = (overrides: Record<string, unknown> = {}) => [{ _count: 5, ...overrides }];

  beforeEach(() => {
    mockPrismaActivityLogCount.mockResolvedValue(100);
    mockPrismaActivityLogGroupBy
      .mockResolvedValueOnce(baseGroupByResult({ userId: "user-1" }))
      .mockResolvedValueOnce(baseGroupByResult({ module: "crm" }))
      .mockResolvedValueOnce(baseGroupByResult({ severity: "INFO" }))
      .mockResolvedValueOnce(baseGroupByResult({ action: "create" }))
      .mockResolvedValueOnce(baseGroupByResult({ userId: "user-1" }))
      .mockResolvedValueOnce(baseGroupByResult({ country: "US" }));
    mockPrismaUserFindMany.mockResolvedValue([{ id: "user-1", name: "Alice", email: "alice@test.com" }]);
    mockPrismaActivityLogFindMany
      .mockResolvedValueOnce([{ createdAt: new Date() }])
      .mockResolvedValueOnce([
        { createdAt: new Date(), action: "login" },
        { createdAt: new Date(Date.now() - 86400000), action: "failed_login" },
      ]);
    mockPrismaSecurityEventCount.mockResolvedValue(5);
    mockPrismaSecurityEventFindMany.mockResolvedValue([{ createdAt: new Date() }]);
  });

  it("returns analytics with all sections", async () => {
    const { getActivityAnalytics } = await import("@/lib/activity");
    const result = await getActivityAnalytics();

    expect(result.totalActivities).toBe(100);
    expect(result.uniqueUsers).toBe(1);
    expect(result.byModule).toHaveLength(1);
    expect(result.bySeverity).toHaveLength(1);
    expect(result.byAction).toHaveLength(1);
    expect(result.topUsers).toHaveLength(1);
    expect(result.dailyCounts).toBeDefined();
    expect(result.loginActivity).toBeDefined();
    expect(result.loginActivity.some((d: any) => d.failed > 0)).toBe(true);
    expect(result.recentTrend).toBeDefined();
  });

  it("accepts date filters", async () => {
    const { getActivityAnalytics } = await import("@/lib/activity");
    await getActivityAnalytics("2024-01-01", "2024-12-31");
    expect(mockPrismaActivityLogCount).toHaveBeenCalled();
  });

  it("handles null country in byCountry", async () => {
    mockPrismaActivityLogGroupBy
      .mockReset()
      .mockResolvedValueOnce(baseGroupByResult({ userId: "user-1" }))
      .mockResolvedValueOnce(baseGroupByResult({ module: "crm" }))
      .mockResolvedValueOnce(baseGroupByResult({ severity: "INFO" }))
      .mockResolvedValueOnce(baseGroupByResult({ action: "create" }))
      .mockResolvedValueOnce(baseGroupByResult({ userId: "user-1" }))
      .mockResolvedValueOnce(baseGroupByResult({ country: null }));
    mockPrismaActivityLogFindMany
      .mockReset()
      .mockResolvedValueOnce([{ createdAt: new Date() }])
      .mockResolvedValueOnce([{ createdAt: new Date(), action: "login" }]);

    const { getActivityAnalytics } = await import("@/lib/activity");
    const result = await getActivityAnalytics();

    expect(result.byCountry[0].country).toBe("Unknown");
  });

  it("handles no users found for topUsers", async () => {
    mockPrismaUserFindMany.mockResolvedValue([]);

    const { getActivityAnalytics } = await import("@/lib/activity");
    const result = await getActivityAnalytics();

    expect(result.topUsers[0].name).toBe("Unknown");
    expect(result.topUsers[0].email).toBe("");
  });

  it("handles empty userIds in topUsers", async () => {
    mockPrismaActivityLogGroupBy
      .mockReset()
      .mockResolvedValueOnce(baseGroupByResult({ userId: "user-1" }))
      .mockResolvedValueOnce(baseGroupByResult({ module: "crm" }))
      .mockResolvedValueOnce(baseGroupByResult({ severity: "INFO" }))
      .mockResolvedValueOnce(baseGroupByResult({ action: "create" }))
      .mockResolvedValueOnce(baseGroupByResult({}))  // No userId
      .mockResolvedValueOnce(baseGroupByResult({ country: "US" }));
    mockPrismaActivityLogFindMany
      .mockReset()
      .mockResolvedValueOnce([{ createdAt: new Date() }])
      .mockResolvedValueOnce([
        { createdAt: new Date(), action: "login" },
        { createdAt: new Date(Date.now() - 86400000), action: "other_action" },
      ]);

    const { getActivityAnalytics } = await import("@/lib/activity");
    const result = await getActivityAnalytics();

    expect(result.topUsers).toHaveLength(0);
  });

  it("handles zero prevCount", async () => {
    mockPrismaActivityLogCount.mockResolvedValue(0);

    const { getActivityAnalytics } = await import("@/lib/activity");
    const result = await getActivityAnalytics();

    expect(result.totalActivities).toBe(0);
    expect(result.recentTrend.value).toBe(0);
  });
});

describe("createAuditTrail", () => {
  it("creates an audit trail entry", async () => {
    mockPrismaAuditTrailCreate.mockResolvedValue({ id: "audit-1" });
    const { createAuditTrail } = await import("@/lib/activity");
    const result = await createAuditTrail({
      entityType: "Lead",
      entityId: "lead-1",
      action: "update",
      field: "status",
      beforeValue: "new",
      afterValue: "contacted",
      beforeData: { status: "new" },
      afterData: { status: "contacted" },
      userId: "user-1",
      description: "Updated lead status",
    });

    expect(mockPrismaAuditTrailCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: "Lead",
          entityId: "lead-1",
          action: "update",
          field: "status",
          userId: "user-1",
        }),
      })
    );
    expect(result).toEqual({ id: "audit-1" });
  });

  it("handles errors gracefully", async () => {
    mockPrismaAuditTrailCreate.mockRejectedValue(new Error("fail"));
    const { createAuditTrail } = await import("@/lib/activity");
    const result = await createAuditTrail({ entityType: "Lead", entityId: "lead-1", action: "create" });
    expect(result).toBeNull();
  });
});

describe("getAuditTrails", () => {
  it("returns paginated audit trails", async () => {
    mockPrismaAuditTrailFindMany.mockResolvedValue([{ id: "audit-1" }]);
    mockPrismaAuditTrailCount.mockResolvedValue(5);
    const { getAuditTrails } = await import("@/lib/activity");
    const result = await getAuditTrails("Lead", "lead-1", "create", 1, 10);

    expect(result.trails).toHaveLength(1);
    expect(result.total).toBe(5);
    expect(result.pages).toBe(1);
  });

  it("returns all trails with no filters", async () => {
    mockPrismaAuditTrailFindMany.mockResolvedValue([{ id: "audit-1" }, { id: "audit-2" }]);
    mockPrismaAuditTrailCount.mockResolvedValue(2);
    const { getAuditTrails } = await import("@/lib/activity");
    const result = await getAuditTrails();

    expect(result.trails).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

describe("createSecurityEvent", () => {
  it("creates a security event", async () => {
    mockPrismaSecurityEventCreate.mockResolvedValue({ id: "sec-1" });
    const { createSecurityEvent } = await import("@/lib/activity");
    const result = await createSecurityEvent({
      eventType: "suspicious_activity",
      description: "Multiple failed logins",
      severity: "CRITICAL",
      userId: "user-1",
      ipAddress: "1.2.3.4",
      userAgent: "Chrome",
      metadata: { count: 10 },
    });

    expect(mockPrismaSecurityEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: "suspicious_activity", severity: "CRITICAL" }),
      })
    );
    expect(result).toEqual({ id: "sec-1" });
  });

  it("handles errors gracefully", async () => {
    mockPrismaSecurityEventCreate.mockRejectedValue(new Error("fail"));
    const { createSecurityEvent } = await import("@/lib/activity");
    const result = await createSecurityEvent({ eventType: "test", description: "test" });
    expect(result).toBeNull();
  });

  it("defaults severity to WARNING", async () => {
    mockPrismaSecurityEventCreate.mockResolvedValue({ id: "sec-1" });
    const { createSecurityEvent } = await import("@/lib/activity");
    await createSecurityEvent({ eventType: "test", description: "test" });
    expect(mockPrismaSecurityEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ severity: "WARNING" }) })
    );
  });
});

describe("getSecurityEvents", () => {
  beforeEach(() => {
    mockPrismaSecurityEventFindMany.mockResolvedValue([{ id: "sec-1" }]);
    mockPrismaSecurityEventCount.mockResolvedValue(5);
  });

  it("returns paginated security events", async () => {
    const { getSecurityEvents } = await import("@/lib/activity");
    const result = await getSecurityEvents();

    expect(result.events).toHaveLength(1);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
  });

  it("filters by all options", async () => {
    const { getSecurityEvents } = await import("@/lib/activity");
    await getSecurityEvents({
      eventType: "suspicious_activity",
      severity: "CRITICAL",
      resolved: false,
      userId: "user-1",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      page: 2,
      limit: 10,
      sort: "oldest",
    });

    expect(mockPrismaSecurityEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eventType: "suspicious_activity",
          severity: "CRITICAL",
          resolved: false,
          userId: "user-1",
        }),
        skip: 10,
        take: 10,
        orderBy: [{ createdAt: "asc" }],
      })
    );
  });

  it("tracks unresolved count", async () => {
    const { getSecurityEvents } = await import("@/lib/activity");
    const result = await getSecurityEvents();
    expect(result.unresolvedCount).toBe(5);
  });

  it("filters by startDate only", async () => {
    const { getSecurityEvents } = await import("@/lib/activity");
    await getSecurityEvents({ startDate: "2024-01-01" });

    expect(mockPrismaSecurityEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    );
  });

  it("filters by endDate only", async () => {
    const { getSecurityEvents } = await import("@/lib/activity");
    await getSecurityEvents({ endDate: "2024-12-31" });

    expect(mockPrismaSecurityEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      })
    );
  });
});

describe("resolveSecurityEvent", () => {
  it("marks event as resolved", async () => {
    mockPrismaSecurityEventUpdate.mockResolvedValue({});
    const { resolveSecurityEvent } = await import("@/lib/activity");
    const result = await resolveSecurityEvent("sec-1");

    expect(mockPrismaSecurityEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sec-1" },
        data: expect.objectContaining({ resolved: true }),
      })
    );
    expect(result).toBe(true);
  });

  it("returns false on error", async () => {
    mockPrismaSecurityEventUpdate.mockRejectedValue(new Error("fail"));
    const { resolveSecurityEvent } = await import("@/lib/activity");
    const result = await resolveSecurityEvent("sec-1");
    expect(result).toBe(false);
  });
});

describe("createUserSession", () => {
  it("creates a user session", async () => {
    mockPrismaUserSessionCreate.mockResolvedValue({ id: "session-1" });
    const { createUserSession } = await import("@/lib/activity");
    await createUserSession({
      userId: "user-1",
      sessionToken: "token-1",
      ipAddress: "1.2.3.4",
      userAgent: "Chrome/120",
      expiresAt: new Date("2025-01-01"),
    });

    expect(mockPrismaUserSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          sessionToken: "token-1",
          ipAddress: "1.2.3.4",
        }),
      })
    );
  });

  it("defaults optional fields to null", async () => {
    mockPrismaUserSessionCreate.mockResolvedValue({ id: "session-2" });
    const { createUserSession } = await import("@/lib/activity");
    await createUserSession({
      userId: "user-2",
      sessionToken: "token-2",
    });

    expect(mockPrismaUserSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-2",
          sessionToken: "token-2",
          ipAddress: null,
          userAgent: null,
          expiresAt: null,
        }),
      })
    );
  });
});

describe("endUserSession", () => {
  it("ends a user session", async () => {
    mockPrismaUserSessionUpdate.mockResolvedValue({});
    const { endUserSession } = await import("@/lib/activity");
    await endUserSession("token-1");

    expect(mockPrismaUserSessionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionToken: "token-1" },
        data: expect.objectContaining({ isActive: false }),
      })
    );
  });
});
