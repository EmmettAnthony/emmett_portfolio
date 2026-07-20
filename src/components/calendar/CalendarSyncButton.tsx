"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2, Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface IntegrationStatus {
  connected: boolean;
  email?: string | null;
  calendarName?: string | null;
  lastSyncedAt?: string | null;
  syncEnabled: boolean;
}

interface IntegrationsResponse {
  integrations: Array<{
    id: string;
    provider: string;
    email: string | null;
    calendarName: string | null;
    syncEnabled: boolean;
    syncDirection: string;
    lastSyncedAt: string | null;
  }>;
  google: IntegrationStatus;
  outlook: IntegrationStatus;
  apple: IntegrationStatus;
  authUrl: string | null;
  outlookAuthUrl: string | null;
}

interface CalendarSyncButtonProps {
  provider: "GOOGLE" | "OUTLOOK" | "APPLE";
}

const PROVIDER_CONFIG: Record<string, { nameKey: string; icon: string; color: string }> = {
  GOOGLE: { nameKey: "google", icon: "📅", color: "bg-blue-600 hover:from-brand-500 hover:to-brand-600" },
  OUTLOOK: { nameKey: "outlook", icon: "📊", color: "bg-purple-600 hover:bg-purple-700" },
  APPLE: { nameKey: "apple", icon: "🍎", color: "bg-zinc-800 hover:bg-black dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-900" },
};

export function CalendarSyncButton({ provider }: CalendarSyncButtonProps) {
  const t = useTranslations("calendar.sync");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  // Apple-specific state (inline form)
  const [appleId, setAppleId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [appleConnectError, setAppleConnectError] = useState<string | null>(null);

  const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.GOOGLE;
  const statusKey: keyof IntegrationsResponse = provider === "GOOGLE" ? "google" : provider === "OUTLOOK" ? "outlook" : "apple";
  const isApple = provider === "APPLE";

  const { data, isLoading } = useQuery<IntegrationsResponse>({
    queryKey: ["calendar-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/integrations");
      if (!res.ok) throw new Error(t("failedToFetch"));
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (isApple) {
        // Apple uses inline form submission instead of OAuth redirect
        setAppleConnectError(null);
        const res = await fetch("/api/calendar/integrations/apple/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appleId, appPassword }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: t("connectionFailed") }));
          throw new Error(err.error || t("failedToConnectApple"));
        }
        return res.json();
      } else {
        // OAuth providers: initiate redirect
        const res = await fetch("/api/calendar/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider }),
        });
        if (!res.ok) throw new Error(t("failedToInitiate"));
        return res.json();
      }
    },
    onSuccess: (data) => {
      if (isApple) {
        // Apple connected via inline form — refresh integration status
        setAppleId("");
        setAppPassword("");
        setShowPassword(false);
        setAppleConnectError(null);
        queryClient.invalidateQueries({ queryKey: ["calendar-integrations"] });
        toast("success", t("appleConnected"));
      } else {
        // OAuth providers: redirect to auth URL
        const url = data.authUrl;
        if (url) {
          window.location.href = url;
        }
      }
    },
    onError: (error) => {
      if (isApple) {
        setAppleConnectError(error instanceof Error ? error.message : t("connectionFailed"));
      } else {
        toast("error", t("failedToConnect"));
      }
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncing(true);
      const integrationsRes = await fetch("/api/calendar/integrations");
      const integrationsData: IntegrationsResponse = await integrationsRes.json();
      const integration = integrationsData.integrations?.find(
        (i: { provider: string }) => i.provider === provider
      );
      if (!integration) throw new Error(t("noIntegrationFound"));

      const res = await fetch(`/api/calendar/integrations/${integration.id}/sync`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(t("syncFailed"));
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast("success", t("synced", { created: data.created, updated: data.updated }));
    },
    onError: () => toast("error", t("syncFailedGeneric")),
    onSettled: () => setSyncing(false),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const integrationsRes = await fetch("/api/calendar/integrations");
      const integrationsData: IntegrationsResponse = await integrationsRes.json();
      const integration = integrationsData.integrations?.find(
        (i: { provider: string }) => i.provider === provider
      );
      if (!integration) throw new Error(t("noIntegrationFound"));
      const res = await fetch(`/api/calendar/integrations/${integration.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(t("failedToDisconnect"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations"] });
      toast("success", t("disconnected"));
    },
    onError: () => toast("error", t("failedToDisconnect")),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const statusObj = data?.[statusKey] as IntegrationStatus | undefined;

  // ── Disconnected state ───────────────────────────────────────────────────
  if (!statusObj?.connected) {
    // For Apple, show an inline form with Apple ID and app-specific password
    if (isApple) {
      return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{t(config.nameKey)}</p>
              <p className="text-xs text-zinc-500">
                {t("icloudDescription")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                {t("appleIdLabel")}
              </label>
              <input
                type="email"
                value={appleId}
                onChange={(e) => {
                  setAppleId(e.target.value);
                  setAppleConnectError(null);
                }}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                {t("appSpecificPasswordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={appPassword}
                  onChange={(e) => {
                    setAppPassword(e.target.value);
                    setAppleConnectError(null);
                  }}
                  placeholder={t("tokenPlaceholder")}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-muted-foreground dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {appleConnectError && (
              <p className="text-xs text-red-500">{appleConnectError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending || !appleId || !appPassword}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50",
                  config.color
                )}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                {connectMutation.isPending ? t("connecting") : t("connect")}
              </button>
              <a
                href="https://appleid.apple.com/account/manage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-600 underline"
              >
                {t("generatePassword")}
              </a>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {t("appleDescription")}
            </p>
          </div>
        </div>
      );
    }

    // For OAuth providers (Google / Outlook): show a Connect button
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{t(config.nameKey)}</p>
              <p className="text-xs text-zinc-500">{t("notConnected")}</p>
            </div>
          </div>
          <button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50",
              config.color
            )}
          >
            {connectMutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("connecting")}</>
            ) : (
              <><ExternalLink className="h-3.5 w-3.5" /> {t("connect")}</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Connected state (all providers) ────────────────────────────────────
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{t(config.nameKey)}</p>
            <p className="text-xs text-zinc-500">
              {statusObj.email || statusObj.calendarName || t("connected")}
            </p>
            {statusObj.lastSyncedAt && (
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {t("lastSynced")} {new Date(statusObj.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || syncing}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
              "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            {syncing ? t("syncing") : t("syncNow")}
          </button>
          <button
            onClick={() => {
              if (confirm(t("disconnectConfirm", { name: t(config.nameKey) }))) {
                disconnectMutation.mutate();
              }
            }}
            disabled={disconnectMutation.isPending}
            className="rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {t("disconnect")}
          </button>
        </div>
      </div>
    </div>
  );
}
