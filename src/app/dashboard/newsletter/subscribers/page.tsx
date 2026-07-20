"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import {
  Loader2,
  Plus,
  Search,
  Users,
  X,
  Download,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TagsIcon,
  GitMerge,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import type { Subscriber, SubscriberStatus } from "@/types/newsletter";

const statusColors: Record<SubscriberStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UNSUBSCRIBED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  BOUNCED: "bg-badge-warning-bg text-badge-warning-text",
  PENDING_VERIFICATION: "bg-badge-info-bg text-badge-info-text",
};

interface PaginatedResponse {
  subscribers: Subscriber[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: {
    active: number;
    unsubscribed: number;
    bounced: number;
    pending: number;
  };
}

export default function SubscribersPage() {

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriberStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({ email: "", firstName: "", lastName: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [batchTagName, setBatchTagName] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<Array<{
    email: string;
    count: number;
    subscribers: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      status: string;
      subscribedAt: string;
      createdAt: string;
    }>;
  }>>([]);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [mergeSelections, setMergeSelections] = useState<Record<string, string>>({});
  const [merging, setMerging] = useState(false);

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["newsletter-subscribers", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        search,
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/newsletter/subscribers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (sub: typeof newSubscriber) => {
      const res = await fetch("/api/newsletter/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error("Failed to add subscriber");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      toast("success", "Subscriber added successfully");
      setShowAddModal(false);
      setNewSubscriber({ email: "", firstName: "", lastName: "" });
    },
    onError: () => toast("error", "Failed to add subscriber"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/subscribers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subscriber");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      toast("success", "Subscriber deleted");
    },
    onError: () => toast("error", "Failed to delete subscriber"),
  });

  const batchMutation = useMutation({
    mutationFn: async (params: { action: string; value?: string }) => {
      const res = await fetch("/api/newsletter/subscribers/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, subscriberIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Batch operation failed");
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      toast("success", `Batch ${vars.action} completed for ${selectedIds.size} subscribers`);
      setSelectedIds(new Set());
    },
    onError: () => toast("error", "Batch operation failed"),
  });

  const handleOpenMerge = async () => {
    setDuplicateLoading(true);
    setShowMergeModal(true);
    try {
      const res = await fetch("/api/newsletter/subscribers/find-duplicates");
      if (!res.ok) throw new Error("Failed to find duplicates");
      const data = await res.json();
      setDuplicateGroups(data.groups);
      const selections: Record<string, string> = {};
      for (const group of data.groups) {
        selections[group.email] = group.subscribers[0].id;
      }
      setMergeSelections(selections);
    } catch {
      toast("error", "Failed to find duplicate subscribers");
      setShowMergeModal(false);
    } finally {
      setDuplicateLoading(false);
    }
  };

  const handleMerge = async (email: string) => {
    const group = duplicateGroups.find((g) => g.email === email);
    if (!group) return;
    const keepId = mergeSelections[email];
    const mergeSub = group.subscribers.find((s) => s.id !== keepId);
    if (!mergeSub) return;
    const keepSub = group.subscribers.find((s) => s.id === keepId);
    if (!keepSub) return;

    setMerging(true);
    try {
      const res = await fetch("/api/newsletter/subscribers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepEmail: keepSub.email, mergeEmail: mergeSub.email }),
      });
      if (!res.ok) throw new Error("Failed to merge");
      toast("success", `Merged ${mergeSub.email} into ${keepSub.email}`);
      setDuplicateGroups((prev) => prev.filter((g) => g.email !== email));
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
    } catch {
      toast("error", "Failed to merge subscribers");
    } finally {
      setMerging(false);
    }
  };

  const handleSelectAll = () => {
    const subs = data?.subscribers;
    if (!subs || subs.length === 0) return;
    if (selectedIds.size === subs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subs.map((s) => s.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    window.open(`/api/newsletter/export?${params.toString()}`, "_blank");
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch("/api/newsletter/import", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        toast("error", err.error ?? "Import failed");
        return;
      }
      const result = await res.json();
      setImportResult(result);
      toast("success", `Imported ${result.imported} subscriber(s)`);
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
    } catch {
      toast("error", "Failed to import subscribers");
    } finally {
      setImporting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Users className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load subscribers</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const counts = data?.counts ?? { active: 0, unsubscribed: 0, bounced: 0, pending: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Subscribers</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {data?.total ?? 0} total subscribers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleOpenMerge}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
          >
            <GitMerge className="h-4 w-4" />
            Merge Duplicates
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
          >
            <Plus className="h-4 w-4" />
            Add Subscriber
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active", value: counts.active, color: "bg-emerald-500" },
          { label: "Unsubscribed", value: counts.unsubscribed, color: "bg-red-500" },
          { label: "Bounced", value: counts.bounced, color: "bg-amber-500" },
          { label: "Pending", value: counts.pending, color: "bg-blue-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-2.5 w-2.5 rounded-full", stat.color)} />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            </div>
            <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING_VERIFICATION"] as const).map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-300 text-muted-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {status === "all" ? "All" : status === "PENDING_VERIFICATION" ? "Pending" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={(data?.subscribers?.length ?? 0) > 0 && selectedIds.size === (data?.subscribers?.length ?? 0)}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Tags</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subscribed</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data?.subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16">
                        <EmptyState
                          icon={Users}
                          title="No subscribers found"
                          description="Try adjusting your search or filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    data?.subscribers.map((sub) => (
                      <tr
                        key={sub.id}
                        className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        onClick={() => {
                          if (!selectedIds.has(sub.id)) {
                            window.location.href = `/dashboard/newsletter/subscribers/${sub.id}`;
                          }
                        }}
                      >
                        <td className="w-10 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sub.id)}
                            onChange={() => handleSelectOne(sub.id)}
                            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                          {sub.firstName} {sub.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{sub.email}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[sub.status])}>
                            {sub.status === "PENDING_VERIFICATION" ? "Pending" : sub.status.charAt(0) + sub.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{sub.source ?? "—"}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">
                          {sub.tags ? (
                            <div className="flex flex-wrap gap-1">
                              {sub.tags.split(",").slice(0, 2).map((tag, i) => (
                                <span key={i} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">{tag.trim()}</span>
                              ))}
                              {sub.tags.split(",").length > 2 && (
                                <span className="text-xs text-zinc-400">+{sub.tags.split(",").length - 2}</span>
                              )}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">
                          {new Date(sub.subscribedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this subscriber?")) {
                                deleteMutation.mutate(sub.id);
                              }
                            }}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 border-t border-zinc-200 bg-blue-50/50 px-6 py-3 dark:border-zinc-800 dark:bg-blue-900/10">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  {selectedIds.size} selected
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setShowBatchTagModal(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground dark:hover:bg-zinc-700"
                  >
                    <TagsIcon className="h-3.5 w-3.5" />
                    Add Tag
                  </button>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) batchMutation.mutate({ action: "changeStatus", value: val });
                      e.target.value = "";
                    }}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground"
                  >
                    <option value="">Change Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="UNSUBSCRIBED">Unsubscribed</option>
                    <option value="BOUNCED">Bounced</option>
                    <option value="PENDING_VERIFICATION">Pending</option>
                  </select>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${selectedIds.size} subscribers?`)) {
                        batchMutation.mutate({ action: "delete" });
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
                <p className="text-sm text-zinc-500">
                  Page {data.page} of {data.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Subscriber</h2>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Email *</label>
                <input
                  type="email"
                  value={newSubscriber.email}
                  onChange={(e) => setNewSubscriber((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">First Name</label>
                  <input
                    type="text"
                    value={newSubscriber.firstName}
                    onChange={(e) => setNewSubscriber((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newSubscriber.lastName}
                    onChange={(e) => setNewSubscriber((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addMutation.mutate(newSubscriber)}
                  disabled={!newSubscriber.email || addMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                >
                  {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Subscriber
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Tag Modal */}
      {showBatchTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Tag {selectedIds.size} Subscribers</h2>
              <button onClick={() => setShowBatchTagModal(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Tag Name</label>
                <input
                  type="text"
                  value={batchTagName}
                  onChange={(e) => setBatchTagName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="e.g., vip, webinar-attendee"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowBatchTagModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!batchTagName.trim()) return;
                    batchMutation.mutate({ action: "tag", value: batchTagName.trim() });
                    setShowBatchTagModal(false);
                    setBatchTagName("");
                  }}
                  disabled={!batchTagName.trim() || batchMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                >
                  {batchMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Apply Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Duplicates Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Merge Duplicates</h2>
              <button onClick={() => setShowMergeModal(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            {duplicateLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : duplicateGroups.length === 0 ? (
              <div className="py-16 text-center">
                <UserCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
                <p className="font-medium text-zinc-700 dark:text-muted-foreground">No duplicates found</p>
                <p className="mt-1 text-sm text-zinc-500">All subscriber emails are unique.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Found {duplicateGroups.length} group(s) with duplicate emails. Select which subscriber to keep for each group.
                </p>
                {duplicateGroups.map((group) => (
                  <div key={group.email} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{group.email}</h3>
                      <span className="text-xs text-zinc-500">{group.count} records</span>
                    </div>
                    <div className="space-y-2">
                      {group.subscribers.map((sub) => (
                        <label
                          key={sub.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                            mergeSelections[group.email] === sub.id
                              ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                              : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          )}
                        >
                          <input
                            type="radio"
                            name={`merge-${group.email}`}
                            checked={mergeSelections[group.email] === sub.id}
                            onChange={() => setMergeSelections((prev) => ({ ...prev, [group.email]: sub.id }))}
                            className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                              {sub.firstName} {sub.lastName}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">{sub.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                statusColors[sub.status as SubscriberStatus]
                              )}>
                                {sub.status === "PENDING_VERIFICATION" ? "Pending" : sub.status.charAt(0) + sub.status.slice(1).toLowerCase()}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {new Date(sub.subscribedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleMerge(group.email)}
                        disabled={merging || !mergeSelections[group.email] || group.subscribers.length < 2}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                      >
                        {merging && <Loader2 className="h-4 w-4 animate-spin" />}
                        Merge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Import Subscribers</h2>
              <button onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importResult ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Import Complete</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-700">
                    <p className="text-2xl font-bold text-emerald-600">{importResult.imported}</p>
                    <p className="text-xs text-zinc-500">Imported</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-700">
                    <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                    <p className="text-xs text-zinc-500">Skipped</p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-500 mb-1">Errors ({importResult.errors.length})</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="flex items-start gap-1.5 text-xs text-red-500">
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                          {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="rounded-xl border-2 border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700 cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
                  {importFile ? (
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">{importFile.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Click to select CSV file</p>
                      <p className="mt-1 text-xs text-zinc-500">Supports CSV with email, first_name, last_name columns</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="text-center">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      const csv = "first_name,last_name,email,phone,company,country,tags,source\nJohn,Doe,john@example.com,+1234567890,Acme Inc,US,web-development,manual_import\nJane,Smith,jane@example.com,,,CA,design,manual_import";
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "sample-subscribers.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Download sample CSV
                  </a>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => { setShowImportModal(false); setImportFile(null); }}
                    className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                  >
                    {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {importing ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}