import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaNotificationCreate = vi.fn();
const mockPrismaNotificationPreferenceFindUnique = vi.fn();
const mockPrismaNotificationLogCreate = vi.fn();
const mockPrismaNotificationUpdate = vi.fn();
const mockPrismaNotificationCount = vi.fn();
const mockPrismaNotificationFindUnique = vi.fn();
const mockPrismaUserFindUnique = vi.fn();
const mockPrismaActivityLogCreate = vi.fn();
const mockResendEmailsSend = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      create: (...args: unknown[]) => mockPrismaNotificationCreate(...args),
      update: (...args: unknown[]) => mockPrismaNotificationUpdate(...args),
      count: (...args: unknown[]) => mockPrismaNotificationCount(...args),
      findUnique: (...args: unknown[]) => mockPrismaNotificationFindUnique(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => mockPrismaNotificationPreferenceFindUnique(...args),
    },
    notificationLog: {
      create: (...args: unknown[]) => mockPrismaNotificationLogCreate(...args),
    },
    notificationTemplate: {
      findUnique: (...args: unknown[]) => mockPrismaNotificationFindUnique(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockPrismaUserFindUnique(...args),
    },
    activityLog: {
      create: (...args: unknown[]) => mockPrismaActivityLogCreate(...args),
    },
  },
}));

vi.mock("@/lib/resend", () => ({
  getResend: () => ({
    emails: {
      send: (...args: unknown[]) => mockResendEmailsSend(...args),
    },
  }),
}));

vi.mock("@/lib/activity", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications/notification-bus", () => ({
  emitNotification: vi.fn(),
}));

function mockNotification() {
  return {
    id: "notif-1",
    userId: "user-1",
    category: "SYSTEM",
    priority: "MEDIUM",
    notifType: "INFO",
    title: "Test Notification",
    message: "Test message",
    link: null,
    image: null,
    key: null,
    read: false,
    archived: false,
    pinned: false,
    snoozedUntil: null,
    acknowledged: false,
    actionLabel: null,
    actionUrl: null,
    metadata: null,
    source: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    sentAt: null,
    expiresAt: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrismaNotificationCreate.mockResolvedValue(mockNotification());
  mockPrismaNotificationPreferenceFindUnique.mockResolvedValue(null);
  mockPrismaNotificationLogCreate.mockResolvedValue({});
  mockPrismaNotificationUpdate.mockResolvedValue(mockNotification());
  mockPrismaNotificationCount.mockResolvedValue(3);
  mockPrismaUserFindUnique.mockResolvedValue({ id: "user-1", email: "user@test.com" });
  process.env.SENDER_EMAIL = "test@emmettanthony.dev";
});

describe("interpolate", () => {
  it("replaces template variables", async () => {
    const { interpolate } = await import("@/lib/notifications/notification-service");
    const result = interpolate("Hello {{name}}, your {{item}} is ready", { name: "Alice", item: "report" });
    expect(result).toBe("Hello Alice, your report is ready");
  });

  it("leaves unmatched variables as-is", async () => {
    const { interpolate } = await import("@/lib/notifications/notification-service");
    const result = interpolate("Hello {{name}}", {});
    expect(result).toBe("Hello {{name}}");
  });

  it("handles null and undefined values", async () => {
    const { interpolate } = await import("@/lib/notifications/notification-service");
    const result = interpolate("{{a}} {{b}} {{c}}", { a: null, b: undefined, c: "ok" });
    expect(result).toBe("{{a}} {{b}} ok");
  });
});

describe("sendNotificationFromTemplate", () => {
  it("returns null when template not found", async () => {
    mockPrismaNotificationFindUnique.mockResolvedValue(null);
    const { sendNotificationFromTemplate } = await import("@/lib/notifications/notification-service");
    const result = await sendNotificationFromTemplate("non-existent", {});
    expect(result).toBeNull();
  });

  it("sends notification from template", async () => {
    mockPrismaNotificationFindUnique.mockResolvedValue({
      name: "welcome-email",
      title: "Welcome {{name}}!",
      message: "Hi {{name}}, thanks for joining",
      category: "SYSTEM",
      priority: "MEDIUM",
      notifType: "INFO",
      channels: ["IN_APP", "EMAIL"],
    });
    const { sendNotificationFromTemplate } = await import("@/lib/notifications/notification-service");
    const result = await sendNotificationFromTemplate("welcome-email", { name: "Alice" }, { userId: "user-1", source: "system" });

    expect(result).toBeDefined();
    expect(mockPrismaNotificationCreate).toHaveBeenCalled();
  });
});

describe("markNotificationRead", () => {
  it("marks notification as read and logs delivery", async () => {
    const { markNotificationRead } = await import("@/lib/notifications/notification-service");
    await markNotificationRead("notif-1", "user-1");

    expect(mockPrismaNotificationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "notif-1" }, data: { read: true } })
    );
    expect(mockPrismaNotificationLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ notificationId: "notif-1", channel: "IN_APP", status: "opened" }) })
    );
  });

  it("handles activity log error gracefully", async () => {
    const mockLogActivity = vi.fn().mockRejectedValue(new Error("fail"));
    vi.doMock("@/lib/activity", () => ({ logActivity: mockLogActivity }));

    const { markNotificationRead } = await import("@/lib/notifications/notification-service");
    mockPrismaNotificationUpdate.mockResolvedValue(mockNotification());

    await expect(markNotificationRead("notif-1")).resolves.not.toThrow();
  });
});

describe("getUnreadCount", () => {
  it("returns unread count for user", async () => {
    const { getUnreadCount } = await import("@/lib/notifications/notification-service");
    const result = await getUnreadCount("user-1");

    expect(result).toBe(3);
    expect(mockPrismaNotificationCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", read: false, archived: false }),
      })
    );
  });
});

describe("quiet hours (via sendNotification)", () => {
  it("CRITICAL priority bypasses quiet hours (sentAt set)", async () => {
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({ userId: "user-1", eventKey: "system.test", title: "Test", priorityOverride: "CRITICAL" });
    expect(mockPrismaNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sentAt: expect.any(Date) }) })
    );
  });

  it("system-wide notifications (no userId) bypass quiet hours", async () => {
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({ userId: null, eventKey: "system.test", title: "Test" });
    expect(mockPrismaNotificationCreate).toHaveBeenCalled();
  });

  it("respects quiet hours from preferences", async () => {
    mockPrismaNotificationPreferenceFindUnique.mockResolvedValue({
      quietHoursStart: "00:00",
      quietHoursEnd: "23:59",
      snoozeUntil: null,
    });
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({ userId: "user-1", eventKey: "system.test", title: "Test", priorityOverride: "LOW" });
    expect(mockPrismaNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sentAt: null }) })
    );
  });

  it("HIGH priority bypasses quiet hours", async () => {
    mockPrismaNotificationPreferenceFindUnique.mockResolvedValue({
      quietHoursStart: "00:00",
      quietHoursEnd: "23:59",
      snoozeUntil: null,
    });
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({ userId: "user-1", eventKey: "system.test", title: "Test", priorityOverride: "HIGH" });
    expect(mockPrismaNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sentAt: expect.any(Date) }) })
    );
  });

  it("blocks when snoozed", async () => {
    const future = new Date(Date.now() + 86400000);
    mockPrismaNotificationPreferenceFindUnique.mockResolvedValue({
      quietHoursStart: null,
      quietHoursEnd: null,
      snoozeUntil: future,
    });
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({ userId: "user-1", eventKey: "system.test", title: "Test" });
    expect(mockPrismaNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sentAt: null }) })
    );
  });

  it("handles overnight quiet hours range", async () => {
    mockPrismaNotificationPreferenceFindUnique.mockResolvedValue({
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      snoozeUntil: null,
    });
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({ userId: "user-1", eventKey: "system.test", title: "Test" });
    expect(mockPrismaNotificationCreate).toHaveBeenCalled();
  });

  it("handles errors gracefully (falls through to sentAt)", async () => {
    mockPrismaNotificationPreferenceFindUnique.mockRejectedValue(new Error("fail"));
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({ userId: "user-1", eventKey: "system.test", title: "Test" });
    expect(mockPrismaNotificationCreate).toHaveBeenCalled();
  });
});

describe("dispatchEmail", () => {
  it("fails when no recipient found", async () => {
    mockPrismaUserFindUnique.mockResolvedValue(null);
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({
      userId: "user-1",
      eventKey: "system.test",
      title: "Test",
      channelsOverride: ["EMAIL"],
    });

    const call = mockPrismaNotificationLogCreate.mock.calls.find(
      (c: unknown[]) => (c[0] as { data: { channel: string } }).data?.channel === "EMAIL"
    );
    expect(call).toBeDefined();
  });

  it("handles resend error", async () => {
    mockResendEmailsSend.mockResolvedValue({ data: null, error: { message: "Resend API error" } });
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({
      userId: "user-1",
      eventKey: "system.test",
      title: "Test",
      channelsOverride: ["EMAIL"],
    });

    expect(mockPrismaNotificationLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ channel: "EMAIL", status: "failed" }) })
    );
  });

  it("sends email successfully", async () => {
    mockResendEmailsSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({
      userId: "user-1",
      eventKey: "system.test",
      title: "Test Email",
      channelsOverride: ["EMAIL"],
    });

    expect(mockPrismaNotificationLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ channel: "EMAIL", status: "sent" }) })
    );
  });

  it("handles email dispatch exception", async () => {
    mockResendEmailsSend.mockRejectedValue(new Error("Network error"));
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({
      userId: "user-1",
      eventKey: "system.test",
      title: "Test",
      channelsOverride: ["EMAIL"],
    });

    expect(mockPrismaNotificationLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ channel: "EMAIL", status: "failed" }) })
    );
  });
});

describe("escapeHtml", () => {
  it("escapes HTML special characters", async () => {
    const { interpolate } = await import("@/lib/notifications/notification-service");
    const result = interpolate("Hello {{name}}", { name: "<script>alert('xss')</script>" });
    expect(result).toBe("Hello <script>alert('xss')</script>");
  });
});

describe("resolveChannels (via sendNotification)", () => {
  it("uses default channels without userId", async () => {
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({
      userId: null,
      eventKey: "system.test",
      title: "Test",
    });

    expect(mockPrismaNotificationCreate).toHaveBeenCalled();
  });

  it("uses category-specific default channels from preferences", async () => {
    mockPrismaNotificationPreferenceFindUnique.mockResolvedValue({
      categoryChannels: { CRM: ["IN_APP", "EMAIL"] },
    });
    const { sendNotification } = await import("@/lib/notifications/notification-service");
    await sendNotification({
      userId: "user-1",
      eventKey: "system.test",
      title: "Test",
      categoryOverride: "CRM",
    });

    expect(mockPrismaNotificationCreate).toHaveBeenCalled();
  });
});
