"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  MessageCircle,
  Volume2,
  Monitor,
  Clock,
  Loader2,
  Save,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  NOTIFICATION_CATEGORIES,
  DELIVERY_CHANNELS,
  CATEGORY_LABELS,
  CHANNEL_LABELS
} from "@/types/notifications";
import { useToast } from "@/components/ui/toast";
import type { NotificationCategory, DeliveryChannel } from "@/types/notifications";

const channelIcons: Record<DeliveryChannel, typeof Bell> = {
  IN_APP: Bell,
  EMAIL: Mail,
  PUSH: Smartphone,
  SMS: MessageSquare,
  WHATSAPP: MessageCircle,
};

const defaultChannels: Record<NotificationCategory, DeliveryChannel[]> = {
  CRM: ["IN_APP", "EMAIL"],
  CONTACT: ["IN_APP", "EMAIL"],
  CALENDAR: ["IN_APP", "EMAIL"],
  PORTFOLIO: ["IN_APP"],
  NEWSLETTER: ["IN_APP"],
  RESUME: ["IN_APP"],
  TESTIMONIAL: ["IN_APP"],
  SUPPORT: ["IN_APP", "EMAIL"],
  SYSTEM: ["IN_APP", "EMAIL"],
};

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [categoryChannels, setCategoryChannels] = useState<Record<string, DeliveryChannel[]>>({});
  const [emailDigest, setEmailDigest] = useState<string>("instant");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopEnabled, setDesktopEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("");
  const [quietHoursEnd, setQuietHoursEnd] = useState("");

  // Fetch preferences
  const { isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data) {
        setCategoryChannels(data.categoryChannels || {});
        setEmailDigest(data.emailDigest || "instant");
        setPushEnabled(data.pushEnabled ?? false);
        setSoundEnabled(data.soundEnabled ?? true);
        setDesktopEnabled(data.desktopEnabled ?? false);
        setQuietHoursStart(data.quietHoursStart || "");
        setQuietHoursEnd(data.quietHoursEnd || "");
      }
      return data;
    },
  });

  // Save preferences
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryChannels,
          emailDigest,
          pushEnabled,
          soundEnabled,
          desktopEnabled,
          quietHoursStart: quietHoursStart || null,
          quietHoursEnd: quietHoursEnd || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast("success", "Notification preferences saved");
    },
    onError: () => toast("error", "Failed to save preferences"),
  });

  const toggleChannel = (category: string, channel: DeliveryChannel) => {
    setCategoryChannels((prev) => {
      const current = prev[category] || defaultChannels[category as NotificationCategory] || ["IN_APP"];
      const updated = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel];
      return { ...prev, [category]: updated };
    });
  };

  const resetToDefaults = () => {
    setCategoryChannels({});
    setEmailDigest("instant");
    setPushEnabled(false);
    setSoundEnabled(true);
    setDesktopEnabled(false);
    setQuietHoursStart("");
    setQuietHoursEnd("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Notification Settings</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Choose how you receive notifications for each category
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Per-Category Channel Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Delivery Channels by Category</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Toggle which delivery channels are active for each notification category
        </p>

        <div className="space-y-2">
          {NOTIFICATION_CATEGORIES.map((cat) => {
            const channels = categoryChannels[cat] || defaultChannels[cat] || ["IN_APP"];
            return (
              <div
                key={cat}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {channels.map((c) => CHANNEL_LABELS[c]).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {DELIVERY_CHANNELS.map((channel) => {
                    const Icon = channelIcons[channel];
                    const isActive = channels.includes(channel);
                    return (
                      <button
                        key={channel}
                        onClick={() => toggleChannel(cat, channel)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700"
                        )}
                        title={CHANNEL_LABELS[channel]}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{CHANNEL_LABELS[channel]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Global Settings</h2>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          {/* Email Digest */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Email Digest</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Receive a digest of notifications via email</p>
              </div>
            </div>
            <select
              value={emailDigest}
              onChange={(e) => setEmailDigest(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Digest</option>
              <option value="never">Never</option>
            </select>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Push Notifications</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Receive push notifications on your device</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-zinc-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full dark:bg-zinc-700" />
            </label>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Notification Sound</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Play a sound when new notifications arrive</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-zinc-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full dark:bg-zinc-700" />
            </label>
          </div>

          {/* Desktop Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Desktop Notifications</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Show browser desktop notifications</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={desktopEnabled}
                onChange={(e) => setDesktopEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-zinc-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full dark:bg-zinc-700" />
            </label>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Quiet Hours</h2>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <Clock className="h-5 w-5 text-zinc-400" />
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">From</label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <span className="mt-5 text-zinc-400">to</span>
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">To</label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
              Notifications will be silenced during this period
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
