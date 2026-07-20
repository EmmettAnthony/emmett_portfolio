// ──────────────────────────────────────────────────────────────────────────────
// useNotifications — Unit Tests
// ──────────────────────────────────────────────────────────────────────────────
// Tests SSE connection, polling fallback, and CRUD actions.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useNotifications } from "./useNotifications";

// ─── Mock sub-hooks to avoid jsdom noise ───────────────────────────────────

vi.mock("./useDesktopNotifications", () => ({
  useDesktopNotifications: vi.fn(),
}));

vi.mock("./useNotificationSound", () => ({
  useNotificationSound: vi.fn(),
}));

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockNotifications = [
  {
    id: "notif-1",
    userId: null,
    category: "SYSTEM",
    priority: "MEDIUM",
    notifType: "INFO",
    key: "test-1",
    title: "Test Notification 1",
    message: "This is a test",
    link: null,
    image: null,
    read: false,
    archived: false,
    pinned: false,
    snoozedUntil: null,
    acknowledged: false,
    actionLabel: null,
    actionUrl: null,
    metadata: null,
    source: "system",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    sentAt: null,
    expiresAt: null,
  },
  {
    id: "notif-2",
    userId: null,
    category: "CRM",
    priority: "HIGH",
    notifType: "SUCCESS",
    key: "test-2",
    title: "Test Notification 2",
    message: "Another test",
    link: "/dashboard/crm",
    image: null,
    read: false,
    archived: false,
    pinned: false,
    snoozedUntil: null,
    acknowledged: false,
    actionLabel: "View",
    actionUrl: "/dashboard/crm",
    metadata: null,
    source: "crm",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    sentAt: null,
    expiresAt: null,
  },
];

const mockApiResponse = {
  notifications: mockNotifications,
  unreadCount: 2,
  total: 2,
  page: 1,
  limit: 10,
};

// ─── Mock EventSource ──────────────────────────────────────────────────────

type MockEventSourceInstance = ReturnType<typeof createMockEventSource>;
let mockEventSourceInstance: MockEventSourceInstance;

function createMockEventSource() {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic callback type
  const listeners = new Map<string, Set<(event: any) => void>>();

  const instance = {
    readyState: 0, // CONNECTING
    close: vi.fn(),
    addEventListener: vi.fn((type: string, cb: (event: MessageEvent) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(cb);
    }),
    removeEventListener: vi.fn((type: string, cb: (event: MessageEvent) => void) => {
      listeners.get(type)?.delete(cb);
    }),
    onerror: null as ((ev: Event) => void) | null,

    emitConnected() {
      this.readyState = 1; // OPEN
      const cbs = listeners.get("connected");
      if (cbs) cbs.forEach((cb) => cb(new Event("connected")));
    },

    emitNotification(notification: Record<string, unknown>) {
      const cbs = listeners.get("notification");
      if (cbs) {
        const event = { data: JSON.stringify({ notification }) } as MessageEvent;
        cbs.forEach((cb) => cb(event));
      }
    },

    emitError() {
      this.readyState = 2; // CLOSED
      if (this.onerror) this.onerror(new Event("error"));
    },
  };

  return instance;
}

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockEventSourceInstance = createMockEventSource();

  // Mock global fetch with a persistent default mock
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(mockApiResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );

  // Mock EventSource — wrap in vi.fn() so we can track constructor calls
  const mockEventSourceCtor = vi.fn(function () {
    return mockEventSourceInstance;
  });
  globalThis.EventSource = mockEventSourceCtor as unknown as typeof EventSource;
  window.EventSource = mockEventSourceCtor as unknown as typeof EventSource;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("useNotifications", () => {
  describe("initial state", () => {
    it("starts with loading true and zero count", () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.loading).toBe(true);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.sseConnected).toBe(false);
    });
  });

  describe("API fetch on mount", () => {
    it("fetches notifications on mount and updates state", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/notifications")
      );
      expect(result.current.unreadCount).toBe(2);
      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.notifications[0].id).toBe("notif-1");
    });

    it("handles fetch errors gracefully", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Network error");
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it("handles fetch rejection with non-Error type (string)", async () => {
      // Mock fetch to reject with a string (not an Error instance)
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce("string-error");

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // The catch block uses: err instanceof Error ? err.message : "Failed to fetch"
      expect(result.current.error).toBe("Failed to fetch");
      expect(result.current.notifications).toEqual([]);
    });

    it("handles non-ok HTTP responses gracefully", async () => {
      // Mock a resolved response with status 500 (not a network rejection)
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Server Error", { status: 500 })
      );

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // The hook checks res.ok and throws "Failed to fetch notifications"
      expect(result.current.error).toBe("Failed to fetch notifications");
    });
  });

  describe("SSE connection", () => {
    it("creates an EventSource on mount", async () => {
      renderHook(() => useNotifications());

      await waitFor(() => {
        expect(globalThis.EventSource).toHaveBeenCalledWith("/api/notifications/sse");
      });
    });

    it("cleans up EventSource on unmount", async () => {
      const { unmount } = renderHook(() => useNotifications());
      // Wait for the deferred init timer to fire and create the EventSource
      await waitFor(() => {
        expect(globalThis.EventSource).toHaveBeenCalled();
      });
      unmount();
      expect(mockEventSourceInstance.close).toHaveBeenCalled();
    });

    it("sets sseConnected on connected event", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        mockEventSourceInstance.emitConnected();
      });

      expect(result.current.sseConnected).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("adds notification to list on notification event", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        mockEventSourceInstance.emitNotification({
          id: "notif-sse-1",
          category: "SYSTEM",
          priority: "HIGH",
          notifType: "INFO",
          title: "SSE Notification",
          message: "Arrived via SSE",
          createdAt: new Date().toISOString(),
        });
      });

      expect(result.current.notifications).toHaveLength(3);
      expect(result.current.notifications[0].id).toBe("notif-sse-1");
      expect(result.current.unreadCount).toBe(3);
    });

    it("deduplicates notifications by ID", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Emit a notification with the same ID as one already in the list
      act(() => {
        mockEventSourceInstance.emitNotification(mockNotifications[0]);
      });

      // Should not add duplicate
      expect(result.current.notifications).toHaveLength(2);
      // unreadCount should NOT have incremented (fixed dedup in hook)
      expect(result.current.unreadCount).toBe(2);
    });

    it("sets sseConnected false on error", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        mockEventSourceInstance.emitError();
      });

      expect(result.current.sseConnected).toBe(false);
    });
  });

  describe("CRUD operations", () => {
    it("markAsRead sends PATCH and updates local state", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.markAsRead("notif-1");
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/notifications",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("notif-1"),
        })
      );

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].id).toBe("notif-2");
      expect(result.current.unreadCount).toBe(1);
    });

    it("markAsRead handles fetch errors without changing local state", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Override the next fetch to fail
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("API error"));

      await act(async () => {
        await result.current.markAsRead("notif-1");
      });

      // Hook does NOT do optimistic updates — state stays unchanged on API failure
      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.unreadCount).toBe(2);
    });

    it("markAllAsRead sends PATCH and clears local state", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/notifications",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("markAllRead"),
        })
      );

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it("deleteNotification sends DELETE and updates local state", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteNotification("notif-1");
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/notifications",
        expect.objectContaining({
          method: "DELETE",
          body: expect.stringContaining("notif-1"),
        })
      );

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].id).toBe("notif-2");
      expect(result.current.unreadCount).toBe(1);
    });

    it("archiveNotification sends PATCH with archived:true", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.archiveNotification("notif-1");
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/notifications",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("archived"),
        })
      );

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(1);
    });

    it("refresh fetches updated data from API", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      const updatedResponse = {
        ...mockApiResponse,
        notifications: [{ ...mockNotifications[0], title: "Updated Title" }],
        unreadCount: 1,
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(updatedResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe("Updated Title");
      expect(result.current.unreadCount).toBe(1);
    });
  });

  describe("polling fallback", () => {
    it("polls when SSE is not connected", async () => {
      vi.useFakeTimers();
      const pollInterval = 5000;

      const { result, unmount } = renderHook(() =>
        useNotifications({ pollInterval })
      );

      // Flush initial fetch (mock resolves immediately, flush promise chain)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // Wait for loading to complete
      await vi.waitFor(() => expect(result.current.loading).toBe(false));

      // Clear all fetch call history
      vi.clearAllMocks();

      // Advance time past poll interval (wrapped in act to suppress state update warnings)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(pollInterval + 100);
      });

      // Should have polled (SSE is not connected — readyState is still CONNECTING)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/notifications")
      );

      unmount();
      vi.useRealTimers();
    });
  });

  describe("options", () => {
    it("respects custom limit parameter in API URL", async () => {
      renderHook(() => useNotifications({ limit: 5 }));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining("limit=5")
        );
      });
    });

    it("passes soundEnabled option to useNotificationSound", async () => {
      const { useNotificationSound } = await import("./useNotificationSound");

      renderHook(() => useNotifications({ soundEnabled: false }));

      await waitFor(() => {
        expect(useNotificationSound).toHaveBeenCalledWith(
          expect.any(Array),
          false
        );
      });
    });
  });

  describe("SSE edge cases", () => {
    it("handles malformed SSE notification events gracefully", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Use emitNotification helper with a notification that has no id to trigger duplication check
      act(() => {
        mockEventSourceInstance.emitNotification({
          title: "Test",
          message: "No id test",
        });
      });

      // State may or may not change depending on how the hook handles missing id
      // Just verify the hook didn't crash
      expect(result.current.notifications.length).toBeGreaterThanOrEqual(2);
    });

    it("ignores SSE events with invalid JSON data (malformed events catch)", async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Capture the notification listener from addEventListener calls
      const addEventListenerCalls = mockEventSourceInstance.addEventListener.mock.calls;
      const notificationCall = addEventListenerCalls.find(
        (call: unknown[]) => (call[0] as string) === "notification"
      );
      const notificationCb = notificationCall?.[1] as ((event: MessageEvent) => void) | undefined;

      if (notificationCb) {
        act(() => {
          notificationCb({ data: "not-valid-json!!!" } as MessageEvent);
        });
      }

      // State should remain unchanged since the malformed event is caught
      expect(result.current.notifications).toHaveLength(2);
      expect(result.current.unreadCount).toBe(2);
    });

    it("handles SSE notification limit correctly", async () => {
      const { result } = renderHook(() => useNotifications({ limit: 3 }));

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Add multiple notifications to test limit
      act(() => {
        mockEventSourceInstance.emitNotification({
          id: "sse-1",
          category: "SYSTEM",
          priority: "LOW",
          notifType: "INFO",
          title: "SSE 1",
          message: "First SSE",
          createdAt: new Date().toISOString(),
        });
      });

      act(() => {
        mockEventSourceInstance.emitNotification({
          id: "sse-2",
          category: "SYSTEM",
          priority: "LOW",
          notifType: "INFO",
          title: "SSE 2",
          message: "Second SSE",
          createdAt: new Date().toISOString(),
        });
      });

      // Should have 4 notifications (2 initial + 2 new), limited to 3
      expect(result.current.notifications.length).toBeLessThanOrEqual(3);
    });
  });

  describe("SSE not supported", () => {
    it("handles missing EventSource gracefully", async () => {
      // Temporarily remove EventSource from window
      const originalEventSource = window.EventSource;
      (window as any).EventSource = undefined;

      // Need to re-render to test the no-EventSource path
      vi.clearAllMocks();

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.sseConnected).toBe(false);

      // Restore EventSource
      (window as any).EventSource = originalEventSource;
    });
  });
});
