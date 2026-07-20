"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Webhook,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import type { Webhook as WebhookData } from "@/types/newsletter";

const EVENT_OPTIONS = ["subscribe", "unsubscribe", "bounce", "open", "click"];

export default function WebhooksPage() {

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState("");
  const [newActive, setNewActive] = useState(true);

  const { data: webhooks, isLoading } = useQuery<WebhookData[]>({
    queryKey: ["newsletter-webhooks"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/webhooks");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { url: string; events: string; secret?: string; active: boolean }) => {
      const res = await fetch("/api/newsletter/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-webhooks"] });
      setShowCreate(false);
      setNewUrl("");
      setNewEvents([]);
      setNewSecret("");
      setNewActive(true);
      toast("success", "Webhook created");
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/webhooks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-webhooks"] });
      toast("success", "Webhook deleted");
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/newsletter/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-webhooks"] });
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const generateSecret = () => {
    const secret = Array.from({ length: 3 }, () =>
      Math.random().toString(36).substring(2, 10)
    ).join("-");
    setNewSecret(secret);
  };

  const truncateUrl = (url: string, max = 50) =>
    url.length > max ? url.slice(0, max) + "..." : url;

  const eventBadge = (event: string) => {
    const colors: Record<string, string> = {
      subscribe: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      unsubscribe: "bg-badge-warning-bg text-badge-warning-text",
      bounce: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      open: "bg-badge-info-bg text-badge-info-text",
      click: "bg-purple-500/10 text-purple-400",
    };
    return (
      <span
        key={event}
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          colors[event] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        )}
      >
        {event}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Webhooks</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Send real-time notifications to external services when events occur
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" /> Add Webhook
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : !webhooks || webhooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="No webhooks yet"
          description="Create a webhook to get notified when subscribers sign up, unsubscribe, or bounce"
          action={{ label: "Add Webhook", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Events</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="max-w-xs px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                    <span title={webhook.url}>{truncateUrl(webhook.url)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {webhook.events.split(",").map(eventBadge)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        toggleMutation.mutate({ id: webhook.id, active: !webhook.active })
                      }
                      className={cn(
                        "relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        webhook.active
                          ? "bg-emerald-500"
                          : "bg-zinc-300 dark:bg-zinc-600"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          webhook.active ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {new Date(webhook.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm("Delete this webhook?")) deleteMutation.mutate(webhook.id);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Add Webhook</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">URL</label>
                <input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Events</label>
                <div className="space-y-2">
                  {EVENT_OPTIONS.map((event) => (
                    <label
                      key={event}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                    >
                      <input
                        type="checkbox"
                        checked={newEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                      />
                      {eventBadge(event)}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Secret <span className="text-zinc-400">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={newSecret}
                    onChange={(e) => setNewSecret(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="HMAC secret for signature"
                  />
                  <button
                    type="button"
                    onClick={generateSecret}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Generate
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Active</label>
                <button
                  type="button"
                  onClick={() => setNewActive(!newActive)}
                  className={cn(
                    "relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    newActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      newActive ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  createMutation.mutate({
                    url: newUrl,
                    events: newEvents.join(","),
                    secret: newSecret || undefined,
                    active: newActive,
                  })
                }
                disabled={!newUrl.trim() || newEvents.length === 0 || createMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
