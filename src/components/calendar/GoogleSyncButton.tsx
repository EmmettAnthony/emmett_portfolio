"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  CheckCircle2,
  Loader2,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface IntegrationStatus {
  connected: boolean;
  email?: string | null;
  calendarName?: string | null;
  lastSyncedAt?: string | null;
  syncEnabled: boolean;
}

export function GoogleSyncButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading } = useQuery<{ google: IntegrationStatus }>({
    queryKey: ["calendar-integrations"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/integrations");
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/calendar/integrations", { method: "POST" });
      if (!res.ok) throw new Error("Failed to initiate connection");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: () => toast("error", "Failed to connect Google Calendar"),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncing(true);
      const integrationsRes = await fetch("/api/calendar/integrations");
      const integrationsData = await integrationsRes.json();
      const googleIntegration = integrationsData.integrations?.find(
        (i: { provider: string }) => i.provider === "GOOGLE"
      );
      if (!googleIntegration) throw new Error("No Google Calendar integration found");

      const res = await fetch(`/api/calendar/integrations/${googleIntegration.id}/sync`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast("success", `Synced: ${data.created} created, ${data.updated} updated`);
    },
    onError: () => toast("error", "Google Calendar sync failed"),
    onSettled: () => setSyncing(false),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const integrationsRes = await fetch("/api/calendar/integrations");
      const integrationsData = await integrationsRes.json();
      const googleIntegration = integrationsData.integrations?.find(
        (i: { provider: string }) => i.provider === "GOOGLE"
      );
      if (!googleIntegration) throw new Error("No integration found");
      const res = await fetch(`/api/calendar/integrations/${googleIntegration.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-integrations"] });
      toast("success", "Google Calendar disconnected");
    },
    onError: () => toast("error", "Failed to disconnect"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const status = data?.google;

  if (!status?.connected) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Google Calendar</p>
              <p className="text-xs text-zinc-500">Not connected</p>
            </div>
          </div>
          <button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-xs font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
          >
            {connectMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ExternalLink className="h-3.5 w-3.5" />
            )}
            Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Google Calendar</p>
            <p className="text-xs text-zinc-500">
              {status.email || status.calendarName || "Connected"}
            </p>
            {status.lastSyncedAt && (
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Last synced: {new Date(status.lastSyncedAt).toLocaleString()}
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
              "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
          <button
            onClick={() => {
              if (confirm("Disconnect Google Calendar? Events already synced will remain in Google Calendar.")) {
                disconnectMutation.mutate();
              }
            }}
            disabled={disconnectMutation.isPending}
            className="rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
