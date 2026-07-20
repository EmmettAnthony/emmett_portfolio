import { describe, it, expect, vi } from "vitest";
import type { NotificationBusEvent } from "@/lib/notifications/notification-bus";

describe("NotificationBus", () => {
  it("offNotification removes a specific listener", async () => {
    const { onNotification, offNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const listener = vi.fn();

    onNotification(listener);
    offNotification(listener);

    emitNotification({
      notification: { id: "n1", title: "Test" } as never,
      eventKey: "test.event",
      isUrgent: false,
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it("onNotification returns unsubscribe function", async () => {
    const { onNotification, emitNotification } = await import("@/lib/notifications/notification-bus");
    const listener = vi.fn();

    const unsubscribe = onNotification(listener);
    unsubscribe();

    emitNotification({
      notification: { id: "n1", title: "Test" } as never,
      eventKey: "test.event",
      isUrgent: false,
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
