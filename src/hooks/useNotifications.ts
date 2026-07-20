// ──────────────────────────────────────────────────────────────────────────────
// useNotifications — Real-time notification hook (SSE + polling fallback)
// ──────────────────────────────────────────────────────────────────────────────
// Connects to the /api/notifications/sse SSE endpoint for instant push updates.
// Falls back to 30s polling if SSE fails or the browser doesn't support it.
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDesktopNotifications } from "./useDesktopNotifications";
import { useNotificationSound } from "./useNotificationSound";
import type { NotificationData } from "@/types/notifications";

interface UseNotificationsOptions {
  /** Polling interval in ms (fallback when SSE is unavailable, default: 30000) */
  pollInterval?: number;
  /** Enable sound notifications (default: true) */
  soundEnabled?: boolean;
  /** Limit for recent notifications (default: 10) */
  limit?: number;
}

interface UseNotificationsReturn {
  /** Current unread count */
  unreadCount: number;
  /** Recent notifications */
  notifications: NotificationData[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Whether SSE is currently connected */
  sseConnected: boolean;
  /** Force refresh */
  refresh: () => Promise<void>;
  /** Mark a single notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Delete a notification */
  deleteNotification: (id: string) => Promise<void>;
  /** Archive a notification */
  archiveNotification: (id: string) => Promise<void>;
}

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { pollInterval = 30000, soundEnabled = true, limit = 10 } = options;

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ─── Fetch data from REST API (used for initial load + polling fallback) ──

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);

      const notifRes = await fetch(`/api/notifications?limit=${limit}&read=false&archived=false&sort=newest`);

      if (!notifRes.ok) throw new Error("Failed to fetch notifications");

      const notifData = await notifRes.json();
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unreadCount ?? notifData.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // ─── SSE Connection ──────────────────────────────────────────────────────

  useEffect(() => {
    let sse: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    function connectSSE() {
      // Check browser support
      if (typeof window === "undefined" || !window.EventSource) {
        setSseConnected(false);
        return;
      }

      try {
        sse = new EventSource("/api/notifications/sse");
        eventSourceRef.current = sse;

        sse.addEventListener("connected", () => {
          setSseConnected(true);
          setError(null);
        });

        sse.addEventListener("notification", (event) => {
          try {
            const data = JSON.parse(event.data);
            const notification = data.notification as NotificationData;

            setNotifications((prev) => {
              // Skip duplicates
              if (prev.some((n) => n.id === notification.id)) return prev;
              // Only increment unread count when a genuinely new notification arrives
              setUnreadCount((prevCount) => prevCount + 1);
              return [notification, ...prev].slice(0, limit);
            });
          } catch {
            // Ignore malformed events
          }
        });

        sse.onerror = () => {
          setSseConnected(false);
          sse?.close();

          // Reconnect after a delay
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connectSSE();
            }, 5000);
          }
        };
      } catch {
        setSseConnected(false);
      }
    }

    // Initial fetch, then connect SSE
    const initTimer = setTimeout(() => {
      fetchNotifications();
      connectSSE();
    }, 0);

    // Polling fallback — runs only when SSE is disconnected
    intervalRef.current = setInterval(() => {
      // Only poll if SSE is not connected
      if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
        fetchNotifications();
      }
    }, pollInterval);

    return () => {
      clearTimeout(initTimer);
      if (sse) sse.close();
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
     
  }, [fetchNotifications, pollInterval, limit]);

  // ─── Desktop notifications ───────────────────────────────────────────────

  useDesktopNotifications(notifications);

  // ─── Sound notifications ─────────────────────────────────────────────────

  useNotificationSound(
    notifications.map((n) => ({ id: n.id, priority: n.priority })),
    soundEnabled
  );

  // ─── Mark as read ────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, data: { read: true } }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  // ─── Mark all as read ────────────────────────────────────────────────────

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  // ─── Delete notification ─────────────────────────────────────────────────

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  // ─── Archive notification ────────────────────────────────────────────────

  const archiveNotification = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, data: { archived: true } }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  return {
    unreadCount,
    notifications,
    loading,
    error,
    sseConnected,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
  };
}
