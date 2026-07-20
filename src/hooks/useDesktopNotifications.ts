"use client";

import { useEffect, useRef, useCallback } from "react";

interface DesktopNotificationData {
  id: string;
  title: string;
  message?: string | null;
  link?: string | null;
  priority: string;
  category: string;
}

/**
 * Maps priority to a severity badge emoji prefix used in the notification title.
 */
const PRIORITY_PREFIX: Record<string, string> = {
  CRITICAL: "🚨 ",
  HIGH: "⚠️ ",
  MEDIUM: "",
  LOW: "",
};

/**
 * Notification icon URL used for all desktop notifications.
 * Uses the site favicon as a consistent, reliable icon.
 * For custom per-category icons, create files in /public/icons/ and update this map.
 */
const NOTIFICATION_ICON = "/favicon.ico";

/**
 * Maximum number of notification IDs tracked to avoid unbounded memory growth.
 */
const MAX_TRACKED_IDS = 500;

/**
 * Hook that monitors notifications and shows browser desktop notifications
 * for all HIGH and CRITICAL priority events. Supports:
 * - Icon for all notifications
 * - Badge icon for notification center
 * - Click-to-navigate action (opens the notification's link)
 * - Persistent notifications for CRITICAL items (requireInteraction)
 * - Auto-close for non-critical notifications
 * - Deduplication by ID with a capped tracking set
 */
export function useDesktopNotifications(notifications: DesktopNotificationData[]) {
  const shownIds = useRef<Set<string>>(new Set());
  const permissionRequested = useRef(false);

  // Request permission on mount (only once per session)
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (permissionRequested.current) return;
    if (Notification.permission === "denied") return;
    if (Notification.permission === "granted") {
      permissionRequested.current = true;
      return;
    }

    permissionRequested.current = true;
    Notification.requestPermission().catch(() => {
      // Silently fail
    });
  }, []);

  // Show desktop notification
  const showDesktopNotif = useCallback((notif: DesktopNotificationData) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const isCritical = notif.priority === "CRITICAL";
    const prefix = PRIORITY_PREFIX[notif.priority] || "";

    try {
      const n = new Notification(`${prefix}${notif.title}`, {
        body: notif.message || `New ${notif.category.toLowerCase()} notification`,
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_ICON,
        tag: `notif-${notif.id}`,
        // Critical notifications stay on screen until dismissed
        requireInteraction: isCritical,
        // Silent for non-critical so we don't double-up with useNotificationSound audio
        silent: !isCritical,
      });

      // Click navigates to the notification's link, then focuses the window
      if (notif.link) {
        const targetUrl: string = notif.link;
        n.onclick = () => {
          window.focus();
          window.location.href = targetUrl;
        };
      }

      // Close automatically after 8s (15s for critical) as a safety net
      const autoCloseMs = isCritical ? 15000 : 8000;
      setTimeout(() => n.close(), autoCloseMs);
    } catch {
      // Notification API can fail in some environments
    }
  }, []);

  // Monitor notifications for new HIGH/CRITICAL items
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    for (const notif of notifications) {
      // Only process HIGH and CRITICAL priority
      if (notif.priority !== "HIGH" && notif.priority !== "CRITICAL") continue;

      // Skip if already shown
      if (shownIds.current.has(notif.id)) continue;

      // Mark as shown
      shownIds.current.add(notif.id);

      // Enforce cap on tracked IDs to avoid unbounded memory growth
      if (shownIds.current.size > MAX_TRACKED_IDS) {
        const idsArray = Array.from(shownIds.current);
        const toRemove = idsArray.slice(0, idsArray.length - MAX_TRACKED_IDS);
        for (const id of toRemove) {
          shownIds.current.delete(id);
        }
      }

      // Show the desktop notification
      showDesktopNotif(notif);
    }
  }, [notifications, showDesktopNotif]);
}
