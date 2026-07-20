import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendNotification = vi.fn();
const mockPrismaNotificationFindMany = vi.fn();
const mockPrismaNotificationCount = vi.fn();
const mockPrismaNotificationUpdateMany = vi.fn();
const mockPrismaNotificationUpdate = vi.fn();
const mockPrismaNotificationDeleteMany = vi.fn();
const mockPrismaNotificationGroupBy = vi.fn();
const mockPrismaNotificationPreferenceFindUnique = vi.fn();
const mockPrismaNotificationPreferenceUpsert = vi.fn();
const mockPrismaNotificationTemplateFindMany = vi.fn();
const mockPrismaNotificationTemplateUpdate = vi.fn();
const mockPrismaNotificationTemplateCreate = vi.fn();
const mockPrismaNotificationTemplateDelete = vi.fn();

vi.mock("@/lib/notifications/notification-service", () => ({
  sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  SendNotificationResult: {},
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: (...args: unknown[]) => mockPrismaNotificationFindMany(...args),
      count: (...args: unknown[]) => mockPrismaNotificationCount(...args),
      updateMany: (...args: unknown[]) => mockPrismaNotificationUpdateMany(...args),
      update: (...args: unknown[]) => mockPrismaNotificationUpdate(...args),
      deleteMany: (...args: unknown[]) => mockPrismaNotificationDeleteMany(...args),
      groupBy: (...args: unknown[]) => mockPrismaNotificationGroupBy(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => mockPrismaNotificationPreferenceFindUnique(...args),
      upsert: (...args: unknown[]) => mockPrismaNotificationPreferenceUpsert(...args),
    },
    notificationTemplate: {
      findMany: (...args: unknown[]) => mockPrismaNotificationTemplateFindMany(...args),
      update: (...args: unknown[]) => mockPrismaNotificationTemplateUpdate(...args),
      create: (...args: unknown[]) => mockPrismaNotificationTemplateCreate(...args),
      delete: (...args: unknown[]) => mockPrismaNotificationTemplateDelete(...args),
    },
  },
}));

const mockResult = { notificationId: "notif-1", channels: [{ channel: "IN_APP" as const, status: "delivered" as const }] };

beforeEach(() => {
  vi.clearAllMocks();
  mockSendNotification.mockResolvedValue(mockResult);
  mockPrismaNotificationFindMany.mockResolvedValue([{ id: "notif-1", title: "Test" }]);
  mockPrismaNotificationCount.mockResolvedValue(5);
  mockPrismaNotificationUpdateMany.mockResolvedValue({ count: 1 });
  mockPrismaNotificationUpdate.mockResolvedValue({ id: "notif-1" });
  mockPrismaNotificationDeleteMany.mockResolvedValue({ count: 1 });
  mockPrismaNotificationGroupBy.mockResolvedValue([{ category: "SYSTEM", _count: 5 }]);
  mockPrismaNotificationPreferenceFindUnique.mockResolvedValue(null);
  mockPrismaNotificationPreferenceUpsert.mockResolvedValue({});
  mockPrismaNotificationTemplateFindMany.mockResolvedValue([{ id: "tmpl-1", name: "test" }]);
  mockPrismaNotificationTemplateUpdate.mockResolvedValue({});
  mockPrismaNotificationTemplateCreate.mockResolvedValue({});
  mockPrismaNotificationTemplateDelete.mockResolvedValue({});
});

describe("createNotification", () => {
  it("creates a system notification", async () => {
    const { createNotification } = await import("@/lib/notifications");
    const result = await createNotification({
      title: "Test",
      message: "Test message",
      link: "/test",
      category: "SYSTEM",
      priority: "HIGH",
      key: "test-key",
    });

    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: "system.user.login",
        title: "Test",
        categoryOverride: "SYSTEM",
        priorityOverride: "HIGH",
      })
    );
    expect(result).toEqual(mockResult);
  });
});

describe("notifyNewContact", () => {
  it("sends contact notification", async () => {
    const { notifyNewContact } = await import("@/lib/notifications");
    await notifyNewContact("contact-1", "Alice", "Question about project");

    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: "contact.submission.new",
        source: "contact",
      })
    );
  });
});

describe("notifyEscalation", () => {
  it("sends escalation notification", async () => {
    const { notifyEscalation } = await import("@/lib/notifications");
    await notifyEscalation("conv-1", "Bob");

    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "chatbot",
        priorityOverride: "HIGH",
      })
    );
  });
});

describe("notifyNewBooking", () => {
  it("sends booking notification", async () => {
    const { notifyNewBooking } = await import("@/lib/notifications");
    await notifyNewBooking("apt-1", "Alice", "2025-06-01");

    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: "calendar.appointment.booked",
        source: "calendar",
      })
    );
  });
});

describe("getNotifications", () => {
  it("returns paginated notifications", async () => {
    const { getNotifications } = await import("@/lib/notifications");
    const result = await getNotifications({ userId: "user-1", page: 1, limit: 10 });

    expect(result.notifications).toHaveLength(1);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(1);
  });

  it("filters by category, priority, read, archived, pinned", async () => {
    const { getNotifications } = await import("@/lib/notifications");
    await getNotifications({ category: "SYSTEM", priority: "HIGH", read: false, archived: false, pinned: true });

    expect(mockPrismaNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: "SYSTEM", priority: "HIGH", read: false, archived: false, pinned: true }),
      })
    );
  });

  it("filters by search term", async () => {
    const { getNotifications } = await import("@/lib/notifications");
    await getNotifications({ search: "test" });

    expect(mockPrismaNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([expect.objectContaining({ title: expect.objectContaining({ contains: "test" }) })]),
        }),
      })
    );
  });

  it("filters by date range", async () => {
    const { getNotifications } = await import("@/lib/notifications");
    await getNotifications({ startDate: "2024-01-01", endDate: "2024-12-31" });

    expect(mockPrismaNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
        }),
      })
    );
  });

  it("sorts oldest first", async () => {
    const { getNotifications } = await import("@/lib/notifications");
    await getNotifications({ sort: "oldest" });

    expect(mockPrismaNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "asc" } })
    );
  });

  it("combines userId and search filters", async () => {
    const { getNotifications } = await import("@/lib/notifications");
    await getNotifications({ userId: "user-1", search: "hello" });

    expect(mockPrismaNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ OR: expect.any(Array) }),
            expect.objectContaining({ OR: expect.any(Array) }),
          ]),
        }),
      })
    );
  });

  it("handles only userId filter", async () => {
    const { getNotifications } = await import("@/lib/notifications");
    await getNotifications({ userId: "user-1" });

    expect(mockPrismaNotificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ userId: "user-1" }),
            expect.objectContaining({ userId: null }),
          ]),
        }),
      })
    );
  });
});

describe("notification mutations", () => {
  it("markAsRead", async () => {
    const { markAsRead } = await import("@/lib/notifications");
    await markAsRead("notif-1");
    expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["notif-1"] } }, data: { read: true } })
    );
  });

  it("markAsRead with array", async () => {
    const { markAsRead } = await import("@/lib/notifications");
    await markAsRead(["notif-1", "notif-2"]);
    expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["notif-1", "notif-2"] } } })
    );
  });

  it("markAsUnread", async () => {
    const { markAsUnread } = await import("@/lib/notifications");
    await markAsUnread(["notif-1"]);
    expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { read: false } })
    );
  });

  it("markAllAsRead", async () => {
    const { markAllAsRead } = await import("@/lib/notifications");
    await markAllAsRead("user-1");
    expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", read: false } })
    );
  });

  it("archiveNotifications", async () => {
    const { archiveNotifications } = await import("@/lib/notifications");
    await archiveNotifications("notif-1");
    expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["notif-1"] } }, data: { archived: true } })
    );
  });

  it("archiveNotifications with array", async () => {
    const { archiveNotifications } = await import("@/lib/notifications");
    await archiveNotifications(["n1", "n2"], false);
    expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["n1", "n2"] } }, data: { archived: false } })
    );
  });

  it("pinNotifications", async () => {
    const { pinNotifications } = await import("@/lib/notifications");
    await pinNotifications("notif-1");
    expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pinned: true } })
    );
  });

  it("pinNotifications with false", async () => {
    const { pinNotifications } = await import("@/lib/notifications");
    await pinNotifications(["n1"], false);
    expect(mockPrismaNotificationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pinned: false } })
    );
  });

  it("deleteNotifications", async () => {
    const { deleteNotifications } = await import("@/lib/notifications");
    await deleteNotifications(["notif-1"]);
    expect(mockPrismaNotificationDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["notif-1"] } } })
    );
  });

  it("acknowledgeNotification", async () => {
    const { acknowledgeNotification } = await import("@/lib/notifications");
    await acknowledgeNotification("notif-1");
    expect(mockPrismaNotificationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "notif-1" }, data: { acknowledged: true } })
    );
  });

  it("snoozeNotification", async () => {
    const { snoozeNotification } = await import("@/lib/notifications");
    const until = new Date("2025-01-01");
    await snoozeNotification("notif-1", until);
    expect(mockPrismaNotificationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "notif-1" }, data: { snoozedUntil: until } })
    );
  });
});

describe("getNotificationAnalytics", () => {
  it("returns analytics", async () => {
    const { getNotificationAnalytics } = await import("@/lib/notifications");
    const result = await getNotificationAnalytics("2024-01-01", "2024-12-31");

    expect(result.total).toBe(5);
    expect(result.unread).toBe(5);
    expect(result.byCategory).toHaveLength(1);
    expect(result.recent).toHaveLength(1);
  });
});

describe("notification preferences", () => {
  it("getNotificationPreferences returns defaults when no prefs", async () => {
    mockPrismaNotificationPreferenceFindUnique.mockResolvedValue(null);
    const { getNotificationPreferences } = await import("@/lib/notifications");
    const result = await getNotificationPreferences("user-1");

    expect(result.userId).toBe("user-1");
    expect(result.emailDigest).toBe("instant");
  });

  it("getNotificationPreferences returns existing prefs", async () => {
    mockPrismaNotificationPreferenceFindUnique.mockResolvedValue({
      userId: "user-1",
      categoryChannels: { CRM: ["IN_APP"] },
      emailDigest: "daily",
      pushEnabled: true,
      soundEnabled: false,
      desktopEnabled: true,
    });
    const { getNotificationPreferences } = await import("@/lib/notifications");
    const result = await getNotificationPreferences("user-1");

    expect(result.emailDigest).toBe("daily");
    expect(result.pushEnabled).toBe(true);
  });

  it("updateNotificationPreferences upserts", async () => {
    const { updateNotificationPreferences } = await import("@/lib/notifications");
    await updateNotificationPreferences("user-1", { emailDigest: "weekly" });

    expect(mockPrismaNotificationPreferenceUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        update: { emailDigest: "weekly" },
        create: { userId: "user-1", emailDigest: "weekly" },
      })
    );
  });
});

describe("notification templates", () => {
  it("getNotificationTemplates", async () => {
    const { getNotificationTemplates } = await import("@/lib/notifications");
    const result = await getNotificationTemplates({ category: "SYSTEM" });

    expect(mockPrismaNotificationTemplateFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: "SYSTEM" } })
    );
    expect(result).toHaveLength(1);
  });

  it("upsertNotificationTemplate updates when id provided", async () => {
    const { upsertNotificationTemplate } = await import("@/lib/notifications");
    await upsertNotificationTemplate({ title: "Updated" }, "tmpl-1");

    expect(mockPrismaNotificationTemplateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "tmpl-1" } })
    );
  });

  it("upsertNotificationTemplate creates when no id", async () => {
    const { upsertNotificationTemplate } = await import("@/lib/notifications");
    await upsertNotificationTemplate({ title: "New", name: "new-template" });

    expect(mockPrismaNotificationTemplateCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: "New" }) })
    );
  });

  it("deleteNotificationTemplate", async () => {
    const { deleteNotificationTemplate } = await import("@/lib/notifications");
    await deleteNotificationTemplate("tmpl-1");

    expect(mockPrismaNotificationTemplateDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "tmpl-1" } })
    );
  });
});
