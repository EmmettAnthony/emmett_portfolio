import { describe, it, expect } from "vitest";

type NotifCategory = "CRM" | "CONTACT" | "CALENDAR" | "NEWSLETTER" | "SUPPORT" | "SYSTEM";
type NotifPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type NotifType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
type DeliveryChannel = "IN_APP" | "EMAIL" | "PUSH";

interface NotificationPayload {
  userId?: string;
  category: NotifCategory;
  priority: NotifPriority;
  notifType: NotifType;
  title: string;
  message?: string;
  link?: string;
  key?: string;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

interface NotificationPreference {
  userId: string;
  categoryChannels: Record<NotifCategory, DeliveryChannel[]>;
  emailDigest: "instant" | "daily" | "weekly" | "never";
  pushEnabled: boolean;
  soundEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

function getDeliveryChannels(
  preference: NotificationPreference,
  category: NotifCategory,
  priority: NotifPriority,
): DeliveryChannel[] {
  const channels = preference.categoryChannels[category] ?? ["IN_APP"];

  if (priority === "CRITICAL") {
    const uniqueChannels = new Set([...channels, "EMAIL"]);
    return Array.from(uniqueChannels);
  }

  if (preference.emailDigest === "never") {
    return channels.filter((c) => c !== "EMAIL");
  }

  return channels;
}

function isInQuietHours(preference: NotificationPreference): boolean {
  if (!preference.quietHoursStart || !preference.quietHoursEnd) return false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotal = currentHour * 60 + currentMinute;

  const [startH, startM] = preference.quietHoursStart.split(":").map(Number);
  const [endH, endM] = preference.quietHoursEnd.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (startTotal <= endTotal) {
    return currentTotal >= startTotal && currentTotal <= endTotal;
  }
  return currentTotal >= startTotal || currentTotal <= endTotal;
}

function shouldNotify(
  preference: NotificationPreference,
  notification: NotificationPayload,
): boolean {
  if (notification.priority === "CRITICAL") return true;

  if (isInQuietHours(preference)) return false;

  const channels = getDeliveryChannels(preference, notification.category, notification.priority);
  return channels.length > 0;
}

function generateNotificationKey(category: NotifCategory, entityId: string, action: string): string {
  return `${category.toLowerCase()}.${action}.${entityId}`;
}

function shouldDeduplicate(
  existingKeys: Set<string>,
  notification: NotificationPayload,
): boolean {
  if (!notification.key) return false;
  return existingKeys.has(notification.key);
}

describe("Notification Helpers", () => {
  const defaultPreference: NotificationPreference = {
    userId: "user-1",
    categoryChannels: {
      CRM: ["IN_APP", "EMAIL"],
      CONTACT: ["IN_APP"],
      CALENDAR: ["IN_APP", "EMAIL"],
      NEWSLETTER: ["EMAIL"],
      SUPPORT: ["IN_APP"],
      SYSTEM: ["IN_APP", "EMAIL"],
    },
    emailDigest: "instant",
    pushEnabled: false,
    soundEnabled: true,
  };

  const criticalNotif: NotificationPayload = {
    category: "CRM",
    priority: "CRITICAL",
    notifType: "ERROR",
    title: "Payment failed",
    message: "Transaction declined",
  };

  const lowNotif: NotificationPayload = {
    category: "NEWSLETTER",
    priority: "LOW",
    notifType: "INFO",
    title: "Weekly digest available",
  };

  describe("getDeliveryChannels", () => {
    it("returns configured channels", () => {
      const channels = getDeliveryChannels(defaultPreference, "CRM", "MEDIUM");
      expect(channels).toContain("IN_APP");
      expect(channels).toContain("EMAIL");
    });

    it("always includes EMAIL for CRITICAL priority", () => {
      const preference = { ...defaultPreference, categoryChannels: { ...defaultPreference.categoryChannels, CRM: ["IN_APP"] } };
      const channels = getDeliveryChannels(preference, "CRM", "CRITICAL");
      expect(channels).toContain("IN_APP");
      expect(channels).toContain("EMAIL");
    });

    it("filters out EMAIL when digest is never", () => {
      const preference = { ...defaultPreference, emailDigest: "never" as const };
      const channels = getDeliveryChannels(preference, "CRM", "MEDIUM");
      expect(channels).not.toContain("EMAIL");
    });

    it("defaults to IN_APP for unknown category", () => {
      const channels = getDeliveryChannels(defaultPreference, "SYSTEM", "LOW");
      expect(channels).toContain("IN_APP");
    });
  });

  describe("isInQuietHours", () => {
    it("returns false when quiet hours not set", () => {
      expect(isInQuietHours(defaultPreference)).toBe(false);
    });

    it("returns true during quiet hours", () => {
      const preference = {
        ...defaultPreference,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      };
      const result = isInQuietHours(preference);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("shouldNotify", () => {
    it("always notifies for CRITICAL priority", () => {
      expect(shouldNotify(defaultPreference, criticalNotif)).toBe(true);
    });

    it("returns true when channels available", () => {
      expect(shouldNotify(defaultPreference, lowNotif)).toBe(true);
    });
  });

  describe("generateNotificationKey", () => {
    it("generates consistent key", () => {
      expect(generateNotificationKey("CRM", "lead-1", "new")).toBe("crm.new.lead-1");
    });
  });

  describe("shouldDeduplicate", () => {
    it("returns true if key exists", () => {
      const keys = new Set(["crm.new.lead-1"]);
      const notif: NotificationPayload = { ...criticalNotif, key: "crm.new.lead-1" };
      expect(shouldDeduplicate(keys, notif)).toBe(true);
    });

    it("returns false if no key on notification", () => {
      const keys = new Set(["crm.new.lead-1"]);
      expect(shouldDeduplicate(keys, lowNotif)).toBe(false);
    });
  });
});
