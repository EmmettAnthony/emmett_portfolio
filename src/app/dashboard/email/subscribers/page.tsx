"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  Download,
  Upload,
  CheckSquare,
  Square,
  Tags,
  MailX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import CsvImportDialog from "@/components/email/CsvImportDialog";

interface SubscriberData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  source: string | null;
  country: string | null;
  createdAt: string;
  tags: string | null;
  preferences?: {
    receiveNewsletters: boolean;
    receivePromotions: boolean;
  } | null;
}

interface SubscribersResponse {
  subscribers: SubscriberData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UNSUBSCRIBED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  BOUNCED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const STATUS_OPTIONS = ["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING_VERIFICATION"] as const;

export default function SubscribersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkStatus, setShowBulkStatus] = useState(false);

  // CSV import
  const [showImport, setShowImport] = useState(false);

  // Bulk unsubscribe
  const [showBulkUnsubscribe, setShowBulkUnsubscribe] = useState(false);

  const { data, isLoading } = useQuery<SubscribersResponse>({
    queryKey: ["email-subscribers", search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/email/subscribers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      return res.json();
    },
  });

  const { data: lists } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: async () => {
      const res = await fetch("/api/email/contact-lists");
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
  });

  // ─── Bulk Actions ────────────────────────────────────────────────────

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/email/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-delete", ids }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["email-subscribers"] });
      toast("success", `Deleted ${result.deleted} subscriber(s)`);
      setSelectedIds(new Set());
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await fetch("/api/email/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-status", ids, status }),
      });
      if (!res.ok) throw new Error("Bulk status update failed");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["email-subscribers"] });
      toast("success", `Updated ${result.updated} subscriber(s)`);
      setSelectedIds(new Set());
      setShowBulkStatus(false);
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const bulkUnsubscribeMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/email/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-unsubscribe", ids }),
      });
      if (!res.ok) throw new Error("Bulk unsubscribe failed");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["email-subscribers"] });
      toast("success", `Unsubscribed ${result.unsubscribed} subscriber(s) from Brevo`);
      setSelectedIds(new Set());
      setShowBulkUnsubscribe(false);
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const handleSelectAll = useCallback(() => {
    if (!data?.subscribers) return;
    if (selectedIds.size === data.subscribers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.subscribers.map((s) => s.id)));
    }
  }, [data, selectedIds]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExportCsv = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/email/subscribers?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscribers-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("success", "Subscribers exported successfully");
    } catch (err) {
      toast("error", `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [search, statusFilter, toast]);

  const handleCsvImport = useCallback(async (data: { csvData: string; listId: string; updateExisting: boolean }) => {
    const res = await fetch("/api/email/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import-csv", csvData: data.csvData, updateExisting: data.updateExisting }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Import failed");
    }
    const result = await res.json();
    queryClient.invalidateQueries({ queryKey: ["email-subscribers"] });
    const imported = result.imported || 0;
    const updated = result.updated || 0;
    const skipped = result.skipped || 0;
    const errCount = result.totalErrors || 0;
    const parts = [`Imported ${imported}`];
    if (updated > 0) parts.push(`updated ${updated}`);
    if (skipped > 0) parts.push(`${skipped} invalid skipped`);
    if (errCount > 0) parts.push(`${errCount} error(s)`);
    toast("success", parts.join(", "));
    return result;
  }, [queryClient, toast]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email/subscribers?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subscriber");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-subscribers"] });
      toast("success", "Subscriber deleted");
      setDeleteId(null);
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const allSelected = data?.subscribers && data.subscribers.length > 0 && selectedIds.size === data.subscribers.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Subscribers</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your email subscribers
          </p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="UNSUBSCRIBED">Unsubscribed</option>
          <option value="BOUNCED">Bounced</option>
          <option value="PENDING_VERIFICATION">Pending</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
        </div>

        <span className="text-xs text-zinc-400">
          {data?.total ?? 0} total subscribers
        </span>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 dark:border-brand-800 dark:bg-brand-900/20">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-brand-200 dark:bg-brand-700" />
          <button
            onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
            disabled={bulkDeleteMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            {bulkDeleteMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Bulk Delete
          </button>
          <div className="relative">
            <button
              onClick={() => setShowBulkStatus(!showBulkStatus)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Tags className="h-3.5 w-3.5" />
              Change Status
            </button>
            {showBulkStatus && (
              <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => bulkStatusMutation.mutate({ ids: Array.from(selectedIds), status: s })}
                    disabled={bulkStatusMutation.isPending}
                    className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {s === "PENDING_VERIFICATION" ? "Pending" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowBulkUnsubscribe(true)}
            disabled={bulkUnsubscribeMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            {bulkUnsubscribeMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MailX className="h-3.5 w-3.5" />
            )}
            Bulk Unsubscribe
          </button>
        </div>
      )}

      {/* Subscribers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="w-12 px-4 py-3 text-left">
                  <button onClick={handleSelectAll} className="p-0.5">
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-brand-600" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Source</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subscribed</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.subscribers && data.subscribers.length > 0 ? (
                data.subscribers.map((sub) => (
                  <tr
                    key={sub.id}
                    className={cn(
                      "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                      selectedIds.has(sub.id) && "bg-brand-50/50 dark:bg-brand-900/10"
                    )}
                  >
                    <td className="px-4 py-4">
                      <button onClick={() => handleSelectOne(sub.id)} className="p-0.5">
                        {selectedIds.has(sub.id) ? (
                          <CheckSquare className="h-4 w-4 text-brand-600" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {sub.firstName} {sub.lastName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{sub.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium", statusColors[sub.status] || "bg-zinc-100 text-zinc-600")}>
                        {sub.status === "PENDING_VERIFICATION" ? "PENDING" : sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 capitalize">{sub.source || "—"}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteId(sub.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                      <Users className="mb-2 h-8 w-8" />
                      <p className="text-sm text-zinc-500">No subscribers found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">
              Page {data.page} of {data.totalPages} ({data.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Subscriber</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-500">Are you sure? This cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        listId=""
        lists={lists || []}
        onImport={handleCsvImport}
        showListSelector={false}
      />

      {/* Bulk Unsubscribe Confirmation Dialog */}
      <Dialog open={showBulkUnsubscribe} onOpenChange={() => setShowBulkUnsubscribe(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Unsubscribe</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-500">
            This will unsubscribe <strong className="text-zinc-800 dark:text-zinc-200">{selectedIds.size}</strong> subscriber(s) in your database <strong className="text-zinc-800 dark:text-zinc-200">and</strong> unlink them from their Brevo lists. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowBulkUnsubscribe(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => bulkUnsubscribeMutation.mutate(Array.from(selectedIds))}
              disabled={bulkUnsubscribeMutation.isPending}
            >
              {bulkUnsubscribeMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Unsubscribe {selectedIds.size} from Brevo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
