"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Ban, Trash2, Plus, Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import type { BlocklistEntry } from "@/types/newsletter";

export default function BlocklistPage() {

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("manual");
  const [newNotes, setNewNotes] = useState("");

  const { data: entries, isLoading } = useQuery<BlocklistEntry[]>({
    queryKey: ["newsletter-blocklist"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/blocklist");
      if (!res.ok) throw new Error("Failed to fetch blocklist");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { email: string; reason: string; notes?: string }) => {
      const res = await fetch("/api/newsletter/blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-blocklist"] });
      toast("success", "Added to blocklist. Email will be suppressed from future sends.");
      setShowAddModal(false);
      setNewEmail("");
      setNewReason("manual");
      setNewNotes("");
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/blocklist?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-blocklist"] });
      toast("success", "Removed from blocklist");
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const filtered = entries?.filter((e) =>
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const reasonBadge = (reason: string | null) => {
    const colors: Record<string, string> = {
      bounced: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      complained: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      manual: "bg-badge-info-bg text-badge-info-text",
    };
    return (
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[reason || "manual"] || colors.manual)}>
        {reason || "manual"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Blocklist</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Suppressed emails that will never receive campaigns
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add Email
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          icon={Ban}
          title="Blocklist is empty"
          description="Bounced and complained emails will appear here automatically"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Added</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((entry) => (
                <tr key={entry.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">{entry.email}</td>
                  <td className="px-6 py-4">{reasonBadge(entry.reason)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{entry.notes || "—"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm("Remove from blocklist?")) deleteMutation.mutate(entry.id);
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Add to Blocklist</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Reason</label>
                <select
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="manual">Manual</option>
                  <option value="bounced">Bounced</option>
                  <option value="complained">Complained</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Notes (optional)</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  placeholder="Why was this email blocked?"
                  className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newEmail.trim()) return;
                  addMutation.mutate({ email: newEmail.trim(), reason: newReason, notes: newNotes || undefined });
                }}
                disabled={!newEmail.trim() || addMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Add to Blocklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
