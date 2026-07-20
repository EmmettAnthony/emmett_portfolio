import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockUpdateMany = vi.fn();
const mockDeleteMany = vi.fn();
const mockUpdate = vi.fn();
const mockGroupBy = vi.fn();
const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockCreate = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
    notificationTemplate: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

const mockSendNotification = vi.fn();
vi.mock("@/lib/notifications/notification-service", () => ({
  sendNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

describe("notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("calls sendNotification with correct payload", async () => {
      mockSendNotification.mockResolvedValue({ notificationId: "n1", channels: [] });
      const { createNotification } = await import("../notifications");
      const result = await createNotification({
        title: "Test",
        message: "Hello",
        link: "/dashboard",
        category: "SYSTEM",
        priority: "HIGH",
        key: "test-key",
      });
      expect(mockSendNotification).toHaveBeenCalledWith({
        eventKey: "system.user.login",
        title: "Test",
        message: "Hello",
        link: "/dashboard",
        key: "test-key",
        source: "system",
        categoryOverride: "SYSTEM",
        priorityOverride: "HIGH",
      });
      expect(result).toEqual({ notificationId: "n1", channels: [] });
    });

    it("works without optional fields", async () => {
      mockSendNotification.mockResolvedValue({ notificationId: "n2", channels: [] });
      const { createNotification } = await import("../notifications");
      const result = await createNotification({ title: "Minimal", category: "CONTACT" });
      expect(mockSendNotification).toHaveBeenCalledWith({
        eventKey: "system.user.login",
        title: "Minimal",
        message: undefined,
        link: undefined,
        key: undefined,
        source: "system",
        categoryOverride: "CONTACT",
        priorityOverride: undefined,
      });
      expect(result).toEqual({ notificationId: "n2", channels: [] });
    });
  });

  describe("notifyNewContact", () => {
    it("sends new contact notification", async () => {
      mockSendNotification.mockResolvedValue({ notificationId: "c1", channels: [] });
      const { notifyNewContact } = await import("../notifications");
      const result = await notifyNewContact("contact-1", "John Doe", "Inquiry about website");
      expect(mockSendNotification).toHaveBeenCalledWith({
        eventKey: "contact.submission.new",
        title: "New contact: John Doe",
        message: "Subject: Inquiry about website",
        link: "/dashboard/contact/submissions",
        key: "contact-new-contact-1",
        source: "contact",
        categoryOverride: "CONTACT",
      });
      expect(result).toEqual({ notificationId: "c1", channels: [] });
    });
  });

  describe("notifyEscalation", () => {
    it("sends escalation notification with visitor name", async () => {
      mockSendNotification.mockResolvedValue({ notificationId: "e1", channels: [] });
      const { notifyEscalation } = await import("../notifications");
      const result = await notifyEscalation("conv-1", "Jane");
      expect(mockSendNotification).toHaveBeenCalledWith({
        eventKey: "contact.submission.new",
        title: expect.stringContaining("Jane"),
        message: "A visitor has requested to speak with a human agent.",
        link: "/dashboard/chatbot/conversations/conv-1",
        key: "chat-escalation-conv-1",
        source: "chatbot",
        categoryOverride: "CONTACT",
        priorityOverride: "HIGH",
      });
      expect(result).toEqual({ notificationId: "e1", channels: [] });
    });

    it("handles null visitorName", async () => {
      mockSendNotification.mockResolvedValue({ notificationId: "e2", channels: [] });
      const { notifyEscalation } = await import("../notifications");
      const result = await notifyEscalation("conv-2", null);
      expect(mockSendNotification).toHaveBeenCalledWith({
        eventKey: "contact.submission.new",
        title: expect.stringContaining("a visitor"),
        message: "A visitor has requested to speak with a human agent.",
        link: "/dashboard/chatbot/conversations/conv-2",
        key: "chat-escalation-conv-2",
        source: "chatbot",
        categoryOverride: "CONTACT",
        priorityOverride: "HIGH",
      });
      expect(result).toEqual({ notificationId: "e2", channels: [] });
    });
  });

  describe("notifyNewBooking", () => {
    it("sends new booking notification", async () => {
      mockSendNotification.mockResolvedValue({ notificationId: "b1", channels: [] });
      const { notifyNewBooking } = await import("../notifications");
      const result = await notifyNewBooking("apt-1", "Alice", "2025-06-15");
      expect(mockSendNotification).toHaveBeenCalledWith({
        eventKey: "calendar.appointment.booked",
        title: "New booking: Alice",
        message: "Date: 2025-06-15",
        link: "/dashboard/contact/booking",
        key: "booking-new-apt-1",
        source: "calendar",
        categoryOverride: "CALENDAR",
      });
      expect(result).toEqual({ notificationId: "b1", channels: [] });
    });
  });

  describe("getNotifications", () => {
    const mockNotifications = [{ id: "n1", title: "Test" }];

    beforeEach(() => {
      mockFindMany.mockResolvedValue(mockNotifications);
      mockCount.mockResolvedValue(1);
    });

    it("returns notifications with default pagination", async () => {
      const { getNotifications } = await import("../notifications");
      const result = await getNotifications({});
      expect(result.notifications).toEqual(mockNotifications);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.totalPages).toBe(1);
    });

    it("filters by userId and includes null userId notifications", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ userId: "user-1" });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([{ userId: "user-1" }, { userId: null }]);
    });

    it("filters by category", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ category: "CONTACT" });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.category).toBe("CONTACT");
    });

    it("filters by priority", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ priority: "HIGH" });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.priority).toBe("HIGH");
    });

    it("filters by read status", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ read: true });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.read).toBe(true);
    });

    it("filters by archived status", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ archived: false });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.archived).toBe(false);
    });

    it("filters by pinned status", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ pinned: true });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.pinned).toBe(true);
    });

    it("filters by search text with case insensitive title/message", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ search: "test" });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { title: { contains: "test", mode: "insensitive" } },
        { message: { contains: "test", mode: "insensitive" } },
      ]);
    });

    it("combines userId and search filters with AND", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ userId: "user-1", search: "hello" });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.AND).toBeDefined();
      expect(where.AND[0]).toEqual({ OR: [{ userId: "user-1" }, { userId: null }] });
      expect(where.AND[1]).toEqual({ OR: [
        { title: { contains: "hello", mode: "insensitive" } },
        { message: { contains: "hello", mode: "insensitive" } },
      ] });
    });

    it("filters by date range", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ startDate: "2025-01-01", endDate: "2025-12-31" });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.createdAt).toBeDefined();
      expect(where.createdAt.gte).toEqual(new Date("2025-01-01"));
      expect(where.createdAt.lte).toEqual(new Date("2025-12-31"));
    });

    it("filters by startDate only", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ startDate: "2025-06-01" });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.createdAt.gte).toEqual(new Date("2025-06-01"));
      expect(where.createdAt.lte).toBeUndefined();
    });

    it("filters by endDate only", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ endDate: "2025-06-30" });
      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.createdAt.gte).toBeUndefined();
      expect(where.createdAt.lte).toEqual(new Date("2025-06-30"));
    });

    it("sorts by oldest", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ sort: "oldest" });
      const orderBy = mockFindMany.mock.calls[0][0].orderBy;
      expect(orderBy.createdAt).toBe("asc");
    });

    it("sorts by newest by default", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({});
      const orderBy = mockFindMany.mock.calls[0][0].orderBy;
      expect(orderBy.createdAt).toBe("desc");
    });

    it("respects custom page and limit with max cap at 100", async () => {
      const { getNotifications } = await import("../notifications");
      await getNotifications({ page: 3, limit: 200 });
      const args = mockFindMany.mock.calls[0][0];
      expect(args.skip).toBe(200);
      expect(args.take).toBe(100);
    });

    it("correctly calculates totalPages", async () => {
      mockCount.mockResolvedValue(55);
      const { getNotifications } = await import("../notifications");
      const result = await getNotifications({ limit: 20 });
      expect(result.totalPages).toBe(3);
    });
  });

  describe("markAsRead", () => {
    it("marks single notification as read", async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 });
      const { markAsRead } = await import("../notifications");
      const result = await markAsRead("n1");
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1"] } },
        data: { read: true },
      });
      expect(result).toBe(true);
    });

    it("marks multiple notifications as read", async () => {
      mockUpdateMany.mockResolvedValue({ count: 2 });
      const { markAsRead } = await import("../notifications");
      const result = await markAsRead(["n1", "n2"]);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1", "n2"] } },
        data: { read: true },
      });
      expect(result).toBe(true);
    });
  });

  describe("markAsUnread", () => {
    it("marks notifications as unread", async () => {
      mockUpdateMany.mockResolvedValue({ count: 2 });
      const { markAsUnread } = await import("../notifications");
      const result = await markAsUnread(["n1", "n2"]);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1", "n2"] } },
        data: { read: false },
      });
      expect(result).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications as read for user", async () => {
      mockUpdateMany.mockResolvedValue({ count: 5 });
      const { markAllAsRead } = await import("../notifications");
      const result = await markAllAsRead("user-1");
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", read: false },
        data: { read: true },
      });
      expect(result).toBe(true);
    });
  });

  describe("archiveNotifications", () => {
    it("archives a single notification", async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 });
      const { archiveNotifications } = await import("../notifications");
      const result = await archiveNotifications("n1");
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1"] } },
        data: { archived: true },
      });
      expect(result).toBe(true);
    });

    it("archives multiple notifications", async () => {
      mockUpdateMany.mockResolvedValue({ count: 2 });
      const { archiveNotifications } = await import("../notifications");
      await archiveNotifications(["n1", "n2"]);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1", "n2"] } },
        data: { archived: true },
      });
    });

    it("unarchives when archived=false", async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 });
      const { archiveNotifications } = await import("../notifications");
      await archiveNotifications("n1", false);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1"] } },
        data: { archived: false },
      });
    });
  });

  describe("pinNotifications", () => {
    it("pins a single notification", async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 });
      const { pinNotifications } = await import("../notifications");
      const result = await pinNotifications("n1");
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1"] } },
        data: { pinned: true },
      });
      expect(result).toBe(true);
    });

    it("pins multiple notifications", async () => {
      mockUpdateMany.mockResolvedValue({ count: 2 });
      const { pinNotifications } = await import("../notifications");
      await pinNotifications(["n1", "n2"]);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1", "n2"] } },
        data: { pinned: true },
      });
    });

    it("unpins when pinned=false", async () => {
      mockUpdateMany.mockResolvedValue({ count: 1 });
      const { pinNotifications } = await import("../notifications");
      await pinNotifications("n1", false);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1"] } },
        data: { pinned: false },
      });
    });
  });

  describe("deleteNotifications", () => {
    it("deletes notifications by ids", async () => {
      mockDeleteMany.mockResolvedValue({ count: 2 });
      const { deleteNotifications } = await import("../notifications");
      const result = await deleteNotifications(["n1", "n2"]);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1", "n2"] } },
      });
      expect(result).toBe(true);
    });

    it("deletes single notification in array", async () => {
      mockDeleteMany.mockResolvedValue({ count: 1 });
      const { deleteNotifications } = await import("../notifications");
      await deleteNotifications(["n1"]);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1"] } },
      });
    });
  });

  describe("acknowledgeNotification", () => {
    it("acknowledges a notification", async () => {
      mockUpdate.mockResolvedValue({ id: "n1", acknowledged: true });
      const { acknowledgeNotification } = await import("../notifications");
      const result = await acknowledgeNotification("n1");
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { acknowledged: true },
      });
      expect(result).toBe(true);
    });
  });

  describe("snoozeNotification", () => {
    it("snoozes notification until given date", async () => {
      const until = new Date("2025-07-01");
      mockUpdate.mockResolvedValue({ id: "n1", snoozedUntil: until });
      const { snoozeNotification } = await import("../notifications");
      const result = await snoozeNotification("n1", until);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { snoozedUntil: until },
      });
      expect(result).toBe(true);
    });
  });

  describe("getNotificationAnalytics", () => {
    beforeEach(() => {
      mockCount.mockResolvedValue(50);
      mockGroupBy.mockResolvedValue([{ category: "CONTACT", _count: 10 }]);
      mockFindMany.mockResolvedValue([{ id: "n1" }]);
    });

    it("returns analytics without date filter", async () => {
      const { getNotificationAnalytics } = await import("../notifications");
      const result = await getNotificationAnalytics();
      expect(result.total).toBe(50);
      expect(result.unread).toBe(50);
      expect(result.byCategory).toEqual([{ category: "CONTACT", _count: 10 }]);
      expect(result.recent).toEqual([{ id: "n1" }]);
      const countCallWhere = mockCount.mock.calls[0][0].where;
      expect(countCallWhere.createdAt).toBeUndefined();
    });

    it("returns analytics with date range", async () => {
      const { getNotificationAnalytics } = await import("../notifications");
      await getNotificationAnalytics("2025-01-01", "2025-12-31");
      const countCallWhere = mockCount.mock.calls[0][0].where;
      expect(countCallWhere.createdAt).toBeDefined();
      expect(countCallWhere.createdAt.gte).toEqual(new Date("2025-01-01"));
      expect(countCallWhere.createdAt.lte).toEqual(new Date("2025-12-31"));
    });

    it("uses startDate only", async () => {
      const { getNotificationAnalytics } = await import("../notifications");
      await getNotificationAnalytics("2025-06-01");
      const countCallWhere = mockCount.mock.calls[0][0].where;
      expect(countCallWhere.createdAt.gte).toEqual(new Date("2025-06-01"));
      expect(countCallWhere.createdAt.lte).toBeUndefined();
    });
  });

  describe("getNotificationPreferences", () => {
    it("returns preferences when found", async () => {
      mockFindUnique.mockResolvedValue({
        userId: "user-1",
        categoryChannels: { CONTACT: ["IN_APP"] },
        emailDigest: "daily",
        pushEnabled: true,
        soundEnabled: false,
        desktopEnabled: true,
      });
      const { getNotificationPreferences } = await import("../notifications");
      const result = await getNotificationPreferences("user-1");
      expect(result.userId).toBe("user-1");
      expect(result.emailDigest).toBe("daily");
    });

    it("returns defaults when no preferences found", async () => {
      mockFindUnique.mockResolvedValue(null);
      const { getNotificationPreferences } = await import("../notifications");
      const result = await getNotificationPreferences("user-2");
      expect(result).toEqual({
        userId: "user-2",
        categoryChannels: {},
        emailDigest: "instant",
        pushEnabled: false,
        soundEnabled: true,
        desktopEnabled: false,
      });
    });
  });

  describe("updateNotificationPreferences", () => {
    it("upserts preferences with given data", async () => {
      mockUpsert.mockResolvedValue({ userId: "user-1", emailDigest: "weekly" });
      const { updateNotificationPreferences } = await import("../notifications");
      const data = { emailDigest: "weekly" };
      const result = await updateNotificationPreferences("user-1", data);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        update: data,
        create: { userId: "user-1", ...data },
      });
      expect(result).toEqual({ userId: "user-1", emailDigest: "weekly" });
    });
  });

  describe("getNotificationTemplates", () => {
    it("returns all templates when no category filter", async () => {
      mockFindMany.mockResolvedValue([{ id: "t1", label: "Default" }]);
      const { getNotificationTemplates } = await import("../notifications");
      const result = await getNotificationTemplates();
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { label: "asc" },
      });
      expect(result).toEqual([{ id: "t1", label: "Default" }]);
    });

    it("filters templates by category", async () => {
      mockFindMany.mockResolvedValue([]);
      const { getNotificationTemplates } = await import("../notifications");
      await getNotificationTemplates({ category: "SYSTEM" });
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { category: "SYSTEM" },
        orderBy: { label: "asc" },
      });
    });
  });

  describe("upsertNotificationTemplate", () => {
    it("updates existing template when id provided", async () => {
      mockUpdate.mockResolvedValue({ id: "t1", label: "Updated" });
      const { upsertNotificationTemplate } = await import("../notifications");
      const data = { label: "Updated" };
      const result = await upsertNotificationTemplate(data, "t1");
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "t1" },
        data,
      });
      expect(result).toEqual({ id: "t1", label: "Updated" });
    });

    it("creates new template when no id provided", async () => {
      mockCreate.mockResolvedValue({ id: "new-t1", label: "New Template" });
      const { upsertNotificationTemplate } = await import("../notifications");
      const data = { label: "New Template", category: "SYSTEM" };
      const result = await upsertNotificationTemplate(data);
      expect(mockCreate).toHaveBeenCalledWith({
        data,
      });
      expect(result).toEqual({ id: "new-t1", label: "New Template" });
    });
  });

  describe("deleteNotificationTemplate", () => {
    it("deletes template by id", async () => {
      mockDelete.mockResolvedValue({ id: "t1" });
      const { deleteNotificationTemplate } = await import("../notifications");
      const result = await deleteNotificationTemplate("t1");
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "t1" } });
      expect(result).toBe(true);
    });
  });
});
