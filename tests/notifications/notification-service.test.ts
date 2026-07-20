import { describe, it, expect, vi, beforeEach } from "vitest";

type NotifCategory = "CRM" | "CONTACT" | "CALENDAR" | "NEWSLETTER" | "SUPPORT" | "SYSTEM";
type NotifPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type NotifType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

interface Notification {
  id: string;
  userId?: string;
  category: NotifCategory;
  priority: NotifPriority;
  notifType: NotifType;
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  archived: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface CreateNotificationInput {
  userId?: string;
  category: NotifCategory;
  priority: NotifPriority;
  notifType: NotifType;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

const mockDb = {
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: mockDb }));

async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const notification = await mockDb.notification.create({
    data: {
      category: input.category,
      priority: input.priority,
      notifType: input.notifType,
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: input.metadata ?? {},
      expiresAt: input.expiresAt,
      userId: input.userId,
      read: false,
      archived: false,
    },
  });
  return notification;
}

async function getNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; category?: NotifCategory; limit?: number },
): Promise<Notification[]> {
  const where: Record<string, unknown> = { userId };
  if (options?.unreadOnly) where.read = false;
  if (options?.category) where.category = options.category;

  return mockDb.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  });
}

async function markAsRead(notificationId: string): Promise<boolean> {
  const result = await mockDb.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  return result !== null;
}

async function markAllAsRead(userId: string): Promise<number> {
  const result = await mockDb.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return result.count;
}

async function archiveNotification(notificationId: string): Promise<boolean> {
  const result = await mockDb.notification.update({
    where: { id: notificationId },
    data: { archived: true },
  });
  return result !== null;
}

async function deleteNotification(notificationId: string): Promise<boolean> {
  await mockDb.notification.delete({ where: { id: notificationId } });
  return true;
}

async function getUnreadCount(userId: string): Promise<number> {
  return mockDb.notification.count({ where: { userId, read: false, archived: false } });
}

describe("Notification Service", () => {
  const mockNotification: Notification = {
    id: "notif-1",
    userId: "user-1",
    category: "CRM",
    priority: "HIGH",
    notifType: "INFO",
    title: "New lead",
    message: "John Doe submitted a contact form",
    read: false,
    archived: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("creates notification with valid input", async () => {
      mockDb.notification.create.mockResolvedValue(mockNotification);

      const result = await createNotification({
        userId: "user-1",
        category: "CRM",
        priority: "HIGH",
        notifType: "INFO",
        title: "New lead",
        message: "John Doe submitted a contact form",
      });

      expect(result.title).toBe("New lead");
      expect(mockDb.notification.create).toHaveBeenCalledOnce();
    });

    it("sets default values", async () => {
      mockDb.notification.create.mockResolvedValue(mockNotification);

      await createNotification({
        category: "SYSTEM",
        priority: "LOW",
        notifType: "INFO",
        title: "System update",
      });

      const createCall = mockDb.notification.create.mock.calls[0][0];
      expect(createCall.data.read).toBe(false);
      expect(createCall.data.archived).toBe(false);
    });
  });

  describe("getNotifications", () => {
    it("returns notifications for user", async () => {
      mockDb.notification.findMany.mockResolvedValue([mockNotification]);
      const result = await getNotifications("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("New lead");
    });

    it("filters unread only", async () => {
      mockDb.notification.findMany.mockResolvedValue([mockNotification]);
      await getNotifications("user-1", { unreadOnly: true });
      expect(mockDb.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ read: false }),
        }),
      );
    });

    it("filters by category", async () => {
      mockDb.notification.findMany.mockResolvedValue([]);
      await getNotifications("user-1", { category: "CRM" });
      expect(mockDb.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "CRM" }),
        }),
      );
    });
  });

  describe("markAsRead", () => {
    it("marks notification as read", async () => {
      mockDb.notification.update.mockResolvedValue({ ...mockNotification, read: true });
      const result = await markAsRead("notif-1");
      expect(result).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications as read for user", async () => {
      mockDb.notification.updateMany.mockResolvedValue({ count: 3 });
      const count = await markAllAsRead("user-1");
      expect(count).toBe(3);
    });
  });

  describe("archiveNotification", () => {
    it("archives notification", async () => {
      mockDb.notification.update.mockResolvedValue({ ...mockNotification, archived: true });
      const result = await archiveNotification("notif-1");
      expect(result).toBe(true);
    });
  });

  describe("deleteNotification", () => {
    it("deletes notification", async () => {
      mockDb.notification.delete.mockResolvedValue(mockNotification);
      const result = await deleteNotification("notif-1");
      expect(result).toBe(true);
    });
  });

  describe("getUnreadCount", () => {
    it("returns unread count", async () => {
      mockDb.notification.count.mockResolvedValue(5);
      const count = await getUnreadCount("user-1");
      expect(count).toBe(5);
    });
  });
});
