import { prisma } from "@/lib/db";
import type { ActivityLogData, ActivityAnalytics } from "@/types/activity";

// ─── Parse user agent for browser/OS/device info ─────────────────────────
function parseUserAgent(ua: string | null | undefined): {
  browser: string | null;
  os: string | null;
  device: string | null;
} {
  if (!ua) return { browser: null, os: null, device: null };

  const lower = ua.toLowerCase();
  let browser: string | null = null;
  let os: string | null = null;
  let device: string | null = null;

  if (lower.includes("chrome") && !lower.includes("edg")) browser = "Chrome";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
  else if (lower.includes("edg")) browser = "Edge";
  else if (lower.includes("opera")) browser = "Opera";
  else browser = "Unknown";

  if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("mac os") || lower.includes("macintosh")) os = "macOS";
  else if (lower.includes("linux")) os = "Linux";
  else if (lower.includes("android")) os = "Android";
  else if (lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
  else os = "Unknown";

  if (lower.includes("iphone")) device = "Mobile";
  else if (lower.includes("ipad")) device = "Tablet";
  else if (lower.includes("android")) device = lower.includes("mobile") ? "Mobile" : "Tablet";
  else if (lower.includes("mobile")) device = "Mobile";
  else device = "Desktop";

  return { browser, os, device };
}

// ─── Log an Activity ─────────────────────────────────────────────────────
export interface LogActivityOptions {
  action: string;
  module: string;
  description: string;
  userId?: string;
  entity?: string;
  entityId?: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  country?: string | null;
}

export async function logActivity(options: LogActivityOptions): Promise<ActivityLogData | null> {
  try {
    const {
      action,
      module,
      description,
      userId,
      entity,
      entityId,
      severity = "INFO",
      metadata,
      ip,
      userAgent,
      country,
    } = options;

    const { browser, os, device } = parseUserAgent(userAgent);

    // Resolve country from IP if not already provided
    const resolvedCountry = country ?? (ip ? await resolveCountryFromIp(ip) : null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const log = await (prisma.activityLog.create as any)({
      data: {
        userId: userId || null,
        action,
        module,
        entity: entity || null,
        entityId: entityId || null,
        description,
        severity,
        metadata: metadata || undefined,
        ip: ip || null,
        userAgent: userAgent || null,
        browser,
        os,
        device,
        country: resolvedCountry,
      },
    });

    return log as unknown as ActivityLogData;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}

// ─── Resolve country from IP (lazy import to avoid circular deps) ───────
async function resolveCountryFromIp(ip: string): Promise<string | null> {
  try {
    const { getCountryFromIp } = await import("@/lib/geo");
    return await getCountryFromIp(ip);
  } catch {
    return null;
  }
}

// ─── Convenience Logging Functions ───────────────────────────────────────
export function logAuthAction(action: string, description: string, userId?: string, ip?: string, ua?: string) {
  return logActivity({ action, module: "auth", description, userId, ip, userAgent: ua });
}

export function logCrmAction(action: string, description: string, entity: string, entityId?: string, userId?: string) {
  return logActivity({ action, module: "crm", description, entity, entityId, userId });
}

export function logContactAction(action: string, description: string, entity?: string, entityId?: string, userId?: string) {
  return logActivity({ action, module: "contact", description, entity, entityId, userId });
}

export function logPortfolioAction(action: string, description: string, entity: string, entityId?: string, userId?: string) {
  return logActivity({ action, module: "portfolio", description, entity, entityId, userId });
}

export function logBlogAction(action: string, description: string, entity: string, entityId?: string, userId?: string) {
  return logActivity({ action, module: "blog", description, entity, entityId, userId });
}

export function logNewsletterAction(action: string, description: string, entity?: string, entityId?: string, userId?: string) {
  return logActivity({ action, module: "newsletter", description, entity, entityId, userId });
}

export function logCalendarAction(action: string, description: string, entity?: string, entityId?: string, userId?: string) {
  return logActivity({ action, module: "calendar", description, entity, entityId, userId });
}

export function logPaymentAction(action: string, description: string, entity?: string, entityId?: string, userId?: string) {
  return logActivity({ action, module: "payment", description, entity, entityId, userId });
}

export function logFileAction(action: string, description: string, entity?: string, entityId?: string, userId?: string) {
  return logActivity({ action, module: "file", description, entity, entityId, userId });
}

export function logSystemAction(action: string, description: string, severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL" = "INFO") {
  return logActivity({ action, module: "system", description, severity });
}

// ─── Get Activity Logs ───────────────────────────────────────────────────
export interface GetActivityLogsOptions {
  search?: string;
  module?: string;
  action?: string;
  severity?: string;
  userId?: string;
  entity?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest";
}

export async function getActivityLogs(options: GetActivityLogsOptions = {}) {
  const {
    search,
    module,
    action,
    severity,
    userId,
    entity,
    entityId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = "newest",
  } = options;

  const where: Record<string, unknown> = {};

  if (module) where.module = module;
  if (action) where.action = action;
  if (severity) where.severity = severity;
  if (userId) where.userId = userId;
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;

  // Date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
  }

  // Search
  if (search) {
    const searchFilter = {
      OR: [
        { description: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { module: { contains: search, mode: "insensitive" } },
      ],
    };
    where.AND = [searchFilter];
  }

  const orderBy: Record<string, string>[] = sort === "oldest"
    ? [{ createdAt: "asc" }]
    : [{ createdAt: "desc" }];

  const skip = (page - 1) * limit;

   
  const [logs, total] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.activityLog.findMany as any)({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.activityLog.count as any)({ where }),
  ]);

  return {
    logs: logs as unknown as ActivityLogData[],
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

// ─── Get Activity Analytics ──────────────────────────────────────────────
export async function getActivityAnalytics(startDate?: string, endDate?: string): Promise<ActivityAnalytics> {
  const dateFilter: Record<string, unknown> = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);
  const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const [
    totalActivities,
    todayActivities,
    failedActions,
    securityEvents,
    uniqueUsers,
    byModule,
    bySeverity,
    byAction,
    topUsers,
    byCountry,
  ] = await Promise.all([
    db.activityLog.count({ where }),
    db.activityLog.count({ where: { createdAt: { gte: todayStart } } }),
    db.activityLog.count({
      where: {
        ...where,
        severity: { in: ["ERROR", "CRITICAL"] },
      },
    }),
    db.securityEvent.count(),
    db.activityLog.groupBy({
      by: ["userId"],
      _count: true,
      where,
    }),
    db.activityLog.groupBy({
      by: ["module"],
      _count: true,
      where,
      orderBy: { _count: { module: "desc" } },
    }),
    db.activityLog.groupBy({
      by: ["severity"],
      _count: true,
      where,
    }),
    db.activityLog.groupBy({
      by: ["action"],
      _count: true,
      where,
      orderBy: { _count: { action: "desc" } },
      take: 10,
    }),
    db.activityLog.groupBy({
      by: ["userId"],
      _count: true,
      where,
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
    db.activityLog.groupBy({
      by: ["country"],
      _count: true,
      where: { ...where, country: { not: null } },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
  ]);

  // Resolve top user names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userIds = (topUsers as any[]).map((u: any) => u.userId).filter(Boolean) as string[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Recent trend
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const [recentCount, prevCount] = await Promise.all([
    db.activityLog.count({ where: { createdAt: { gte: last7Days } } }),
    db.activityLog.count({ where: { createdAt: { gte: prev7Days, lt: last7Days } } }),
  ]);

  // Daily counts for chart
  const dailyLogs = await db.activityLog.findMany({
    where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, number>();
  for (const l of dailyLogs) {
    const day = l.createdAt.toISOString().split("T")[0];
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  }

  // Login activity
  const loginLogs = await db.activityLog.findMany({
    where: {
      module: "auth",
      createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { createdAt: true, action: true },
    orderBy: { createdAt: "asc" },
  });

  const loginDailyMap = new Map<string, { success: number; failed: number }>();
  for (const l of loginLogs) {
    const day = l.createdAt.toISOString().split("T")[0];
    const entry = loginDailyMap.get(day) || { success: 0, failed: 0 };
    if (l.action === "failed_login") entry.failed++;
    else if (l.action === "login") entry.success++;
    loginDailyMap.set(day, entry);
  }

  // Security incidents
  const securityLogs = await db.securityEvent.findMany({
    where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const securityDailyMap = new Map<string, number>();
  for (const s of securityLogs) {
    const day = s.createdAt.toISOString().split("T")[0];
    securityDailyMap.set(day, (securityDailyMap.get(day) || 0) + 1);
  }

  return {
    totalActivities,
    todayActivities,
    failedActions,
    securityEvents,
    uniqueUsers: uniqueUsers.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    byModule: (byModule as any[]).map((m: any) => ({ module: m.module, count: m._count })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bySeverity: (bySeverity as any[]).map((s: any) => ({ severity: s.severity, count: s._count })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    byAction: (byAction as any[]).map((a: any) => ({ action: a.action, count: a._count })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    byCountry: (byCountry as any[]).map((c: any) => ({ country: c.country || "Unknown", count: c._count })),
    dailyCounts: Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    topUsers: (topUsers as any[])
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic callback type
      .filter((u: any) => u.userId)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic callback type
      .map((u: any) => {
        const user = userMap.get(u.userId);
        return {
          userId: u.userId,
          name: user?.name || "Unknown",
          email: user?.email || "",
          count: u._count,
        };
      }),
    recentTrend: {
      value: prevCount > 0 ? Math.round(((recentCount - prevCount) / prevCount) * 100) : 0,
      positive: recentCount >= prevCount,
    },
    loginActivity: Array.from(loginDailyMap.entries()).map(([date, data]) => ({ date, ...data })),
    securityIncidents: Array.from(securityDailyMap.entries()).map(([date, count]) => ({ date, count })),
  };
}

// ─── Audit Trail ─────────────────────────────────────────────────────────
export async function createAuditTrail(data: {
  entityType: string;
  entityId: string;
  action: "create" | "update" | "delete";
  field?: string;
  beforeValue?: string;
  afterValue?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  userId?: string;
  description?: string;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma.auditTrail.create as any)({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        field: data.field || null,
        beforeValue: data.beforeValue || null,
        afterValue: data.afterValue || null,
        beforeData: data.beforeData || undefined,
        afterData: data.afterData || undefined,
        userId: data.userId || null,
        description: data.description || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit trail:", error);
    return null;
  }
}

export async function getAuditTrails(
  entityType?: string,
  entityId?: string,
  action?: string,
  page = 1,
  limit = 50
) {
  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;

  const [trails, total] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.auditTrail.findMany as any)({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.auditTrail.count as any)({ where }),
  ]);

  return { trails, total, page, pages: Math.ceil(total / limit) };
}

// ─── Security Events ─────────────────────────────────────────────────────
export async function createSecurityEvent(data: {
  eventType: string;
  description: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma.securityEvent.create as any)({
      data: {
        eventType: data.eventType,
        description: data.description,
        severity: data.severity || "WARNING",
        userId: data.userId || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        metadata: data.metadata || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create security event:", error);
    return null;
  }
}

export async function getSecurityEvents(options: {
  eventType?: string;
  severity?: string;
  resolved?: boolean;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest";
} = {}) {
  const {
    eventType,
    severity,
    resolved,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = "newest",
  } = options;

  const where: Record<string, unknown> = {};
  if (eventType) where.eventType = eventType;
  if (severity) where.severity = severity;
  if (resolved !== undefined) where.resolved = resolved;
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
  }

  const orderBy: Record<string, string>[] = sort === "oldest"
    ? [{ createdAt: "asc" }]
    : [{ createdAt: "desc" }];     
    const [events, total, unresolvedCount] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.securityEvent.findMany as any)({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.securityEvent.count as any)({ where }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.securityEvent.count as any)({ where: { resolved: false } }),
    ]);

  return {
    events,
    total,
    unresolvedCount,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function resolveSecurityEvent(id: string) {
  try {
    await prisma.securityEvent.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

// ─── User Sessions ───────────────────────────────────────────────────────
export async function createUserSession(data: {
  userId: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date;
}) {
  const { browser, os, device } = parseUserAgent(data.userAgent);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma.userSession.create as any)({
    data: {
      userId: data.userId,
      sessionToken: data.sessionToken,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      browser,
      os,
      device,
      expiresAt: data.expiresAt || null,
    },
  });
}

export async function endUserSession(sessionToken: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma.userSession.update as any)({
    where: { sessionToken },
    data: { isActive: false, endedAt: new Date() },
  });
}
