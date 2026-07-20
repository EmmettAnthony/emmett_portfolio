"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationBellProps {
  className?: string;
  onNotificationCountChange?: (count: number) => void;
}

const STORAGE_KEY = "notif-sound-enabled";

function getStoredSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== null ? stored === "true" : true;
}

export function NotificationBell({ className, onNotificationCountChange }: NotificationBellProps) {

  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(getStoredSoundEnabled);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  // Persist sound preference to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const {
    unreadCount,
    notifications,
    loading,
    sseConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications({ limit: 10, soundEnabled });

  // Notify parent of count changes
  useEffect(() => {
    onNotificationCountChange?.(unreadCount);
  }, [unreadCount, onNotificationCountChange]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell
          className={cn(
            "h-5 w-5 transition-transform",
            isOpen && "scale-110",
            unreadCount > 0 && "animate-[ring_0.3s_ease-in-out]"
          )}
        />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {/* SSE connection status dot */}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-900 transition-colors",
            sseConnected
              ? "bg-green-500"
              : "bg-zinc-300 dark:bg-zinc-600"
          )}
          title={sseConnected ? "Real-time connected" : "Real-time disconnected — polling"}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 animate-in slide-in-from-top-2 fade-in-0">
          <NotificationDropdown
            notifications={notifications}
            loading={loading}
            unreadCount={unreadCount}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onMarkRead={(id) => markAsRead(id)}
            onMarkAllRead={() => markAllAsRead()}
            onDelete={(id) => deleteNotification(id)}
            onClose={() => setIsOpen(false)}
            onRefresh={refresh}
          />
        </div>
      )}
    </div>
  );
}
