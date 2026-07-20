import { describe, it, expect } from "vitest";
import {
  notificationFilterSchema,
  createNotificationSchema,
  updateNotificationSchema,
  bulkNotificationActionSchema,
  updateNotificationPreferencesSchema,
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  notificationAnalyticsSchema,
} from "../validations/notifications";

describe("notificationFilterSchema", () => {
  it("parses with defaults", () => {
    const result = notificationFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sort).toBe("newest");
  });

  it("parses with all fields", () => {
    const result = notificationFilterSchema.parse({
      category: "CRM",
      priority: "HIGH",
      notifType: "WARNING",
      read: true,
      archived: false,
      pinned: true,
      search: "test",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      page: 2,
      limit: 50,
      sort: "oldest",
    });
    expect(result.category).toBe("CRM");
    expect(result.priority).toBe("HIGH");
    expect(result.read).toBe(true);
    expect(result.sort).toBe("oldest");
  });

  it("coerces read to boolean", () => {
    const result = notificationFilterSchema.parse({ read: "true" });
    expect(result.read).toBe(true);
  });

  it("rejects invalid sort", () => {
    const result = notificationFilterSchema.safeParse({ sort: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects negative page", () => {
    const result = notificationFilterSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects limit over 100", () => {
    const result = notificationFilterSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });
});

describe("createNotificationSchema", () => {
  it("parses valid notification", () => {
    const result = createNotificationSchema.parse({
      title: "Test Notification",
    });
    expect(result.title).toBe("Test Notification");
    expect(result.category).toBe("SYSTEM");
    expect(result.priority).toBe("MEDIUM");
    expect(result.notifType).toBe("INFO");
    expect(result.channels).toEqual(["IN_APP"]);
  });

  it("rejects empty title", () => {
    const result = createNotificationSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 300 chars", () => {
    const result = createNotificationSchema.safeParse({
      title: "T".repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = createNotificationSchema.parse({
      userId: "user_1",
      category: "CRM",
      priority: "HIGH",
      notifType: "WARNING",
      key: "test_key",
      title: "Test",
      message: "Test message",
      link: "/dashboard",
      image: "https://example.com/image.png",
      actionLabel: "View",
      actionUrl: "/dashboard/test",
      metadata: { foo: "bar" },
      source: "system",
      scheduledAt: "2024-01-01T00:00:00Z",
      expiresAt: "2024-12-31T00:00:00Z",
      channels: ["IN_APP", "EMAIL"],
    });
    expect(result.category).toBe("CRM");
    expect(result.channels).toEqual(["IN_APP", "EMAIL"]);
  });

  it("rejects invalid category", () => {
    const result = createNotificationSchema.safeParse({
      title: "Test",
      category: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = createNotificationSchema.safeParse({
      title: "Test",
      priority: "TOP",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime format", () => {
    const result = createNotificationSchema.safeParse({
      title: "Test",
      scheduledAt: "not-a-datetime",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for image", () => {
    const result = createNotificationSchema.parse({
      title: "Test",
      image: "",
    });
    expect(result.image).toBe("");
  });

  it("rejects invalid url for image", () => {
    const result = createNotificationSchema.safeParse({
      title: "Test",
      image: "not-an-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid channel", () => {
    const result = createNotificationSchema.safeParse({
      title: "Test",
      channels: ["FAKE"],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateNotificationSchema", () => {
  it("parses empty object", () => {
    const result = updateNotificationSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with all fields", () => {
    const result = updateNotificationSchema.parse({
      read: true,
      archived: false,
      pinned: true,
      acknowledged: true,
      snoozedUntil: "2024-01-01T00:00:00Z",
    });
    expect(result.read).toBe(true);
    expect(result.archived).toBe(false);
    expect(result.pinned).toBe(true);
    expect(result.acknowledged).toBe(true);
  });
});

describe("bulkNotificationActionSchema", () => {
  it("parses valid bulk action", () => {
    const result = bulkNotificationActionSchema.parse({
      ids: ["id1", "id2"],
      action: "mark_read",
    });
    expect(result.ids).toEqual(["id1", "id2"]);
    expect(result.action).toBe("mark_read");
  });

  it("rejects empty ids", () => {
    const result = bulkNotificationActionSchema.safeParse({
      ids: [],
      action: "mark_read",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 100 ids", () => {
    const result = bulkNotificationActionSchema.safeParse({
      ids: Array(101).fill("id"),
      action: "mark_read",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid action", () => {
    const result = bulkNotificationActionSchema.safeParse({
      ids: ["id1"],
      action: "invalid_action",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateNotificationPreferencesSchema", () => {
  it("parses empty object", () => {
    const result = updateNotificationPreferencesSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with all fields", () => {
    const result = updateNotificationPreferencesSchema.parse({
      categoryChannels: {
        CRM: ["IN_APP", "EMAIL"],
        CONTACT: ["EMAIL"],
        CALENDAR: ["IN_APP"],
        PORTFOLIO: ["IN_APP"],
        NEWSLETTER: ["EMAIL"],
        RESUME: ["IN_APP"],
        TESTIMONIAL: ["EMAIL"],
        SYSTEM: ["PUSH"],
      },
      emailDigest: "daily",
      pushEnabled: true,
      soundEnabled: false,
      desktopEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      snoozeUntil: "2024-01-01T00:00:00Z",
    });
    expect(result.emailDigest).toBe("daily");
    expect(result.categoryChannels?.CRM).toEqual(["IN_APP", "EMAIL"]);
    expect(result.quietHoursStart).toBe("22:00");
  });

  it("rejects invalid emailDigest", () => {
    const result = updateNotificationPreferencesSchema.safeParse({
      emailDigest: "hourly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid quiet hours format", () => {
    const result = updateNotificationPreferencesSchema.safeParse({
      quietHoursStart: "10pm",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category in categoryChannels", () => {
    const result = updateNotificationPreferencesSchema.safeParse({
      categoryChannels: {
        FAKE: ["IN_APP"],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("createNotificationTemplateSchema", () => {
  it("parses valid template", () => {
    const result = createNotificationTemplateSchema.parse({
      name: "Template",
      label: "Test Template",
      title: "Notification Title",
    });
    expect(result.name).toBe("Template");
    expect(result.label).toBe("Test Template");
    expect(result.title).toBe("Notification Title");
    expect(result.category).toBe("SYSTEM");
    expect(result.priority).toBe("MEDIUM");
    expect(result.notifType).toBe("INFO");
    expect(result.variables).toEqual([]);
    expect(result.channels).toEqual(["IN_APP"]);
  });

  it("rejects empty name", () => {
    const result = createNotificationTemplateSchema.safeParse({
      name: "",
      label: "Test",
      title: "Title",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty label", () => {
    const result = createNotificationTemplateSchema.safeParse({
      name: "Test",
      label: "",
      title: "Title",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createNotificationTemplateSchema.safeParse({
      name: "Test",
      label: "Test",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = createNotificationTemplateSchema.parse({
      name: "Template",
      label: "Test Template",
      category: "CRM",
      priority: "HIGH",
      notifType: "ERROR",
      title: "Notification Title",
      message: "Message",
      emailSubject: "Subject",
      emailBody: "<p>Body</p>",
      pushTitle: "Push Title",
      pushBody: "Push Body",
      variables: ["user_name"],
      channels: ["IN_APP", "EMAIL", "PUSH"],
      actionLabel: "View",
    });
    expect(result.emailSubject).toBe("Subject");
    expect(result.variables).toEqual(["user_name"]);
    expect(result.channels).toEqual(["IN_APP", "EMAIL", "PUSH"]);
  });
});

describe("updateNotificationTemplateSchema", () => {
  it("parses empty object", () => {
    const result = updateNotificationTemplateSchema.parse({});
    expect(result).toEqual({
      category: "SYSTEM",
      channels: ["IN_APP"],
      notifType: "INFO",
      priority: "MEDIUM",
      variables: [],
    });
  });
});

describe("notificationAnalyticsSchema", () => {
  it("parses empty object", () => {
    const result = notificationAnalyticsSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with all fields", () => {
    const result = notificationAnalyticsSchema.parse({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      category: "CRM",
    });
    expect(result.startDate).toBe("2024-01-01");
    expect(result.category).toBe("CRM");
  });
});
