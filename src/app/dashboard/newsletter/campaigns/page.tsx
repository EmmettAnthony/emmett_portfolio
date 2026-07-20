"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  Mail,
  PenSquare,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import type { Campaign, CampaignStatus } from "@/types/newsletter";

const statusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground" },
  REVIEW: { label: "In Review", color: "bg-badge-warning-bg text-badge-warning-text" },
  APPROVED: { label: "Approved", color: "bg-badge-success-bg text-badge-success-text" },
  SCHEDULED: { label: "Scheduled", color: "bg-badge-info-bg text-badge-info-text" },
  SENDING: { label: "Sending", color: "bg-badge-warning-bg text-badge-warning-text" },
  AWAITING_WINNER: { label: "A/B Testing", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  SENT: { label: "Sent", color: "bg-badge-success-bg text-badge-success-text" },
  PAUSED: { label: "Paused", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CANCELLED: { label: "Cancelled", color: "bg-badge-error-bg text-badge-error-text" },
  FAILED: { label: "Failed", color: "bg-badge-error-bg text-badge-error-text" },
};

interface PaginatedResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: {
    draft: number;
    scheduled: number;
    sending: number;
    sent: number;
  };
}

export default function CampaignsPage() {

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ["newsletter-campaigns", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        search,
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/newsletter/campaigns?${params}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      toast("success", "Campaign deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete campaign"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/campaigns/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      toast("success", "Campaign duplicated");
    },
    onError: () => toast("error", "Failed to duplicate campaign"),
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Mail className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load campaigns</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const counts = data?.counts ?? { draft: 0, scheduled: 0, sending: 0, sent: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {data?.total ?? 0} total campaigns
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/newsletter/campaigns/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Draft", value: counts.draft, color: "bg-zinc-500" },
          { label: "Scheduled", value: counts.scheduled, color: "bg-blue-500" },
          { label: "Sending", value: counts.sending, color: "bg-amber-500" },
          { label: "Sent", value: counts.sent, color: "bg-emerald-500" },
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
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "DRAFT", "SCHEDULED", "SENDING", "SENT"] as const).map((status) => (
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
              {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
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
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Sent / Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Open Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Click Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data?.campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16">
                        <EmptyState
                          icon={Mail}
                          title="No campaigns found"
                          description="Try adjusting your search or filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    data?.campaigns.map((campaign) => {
                      const totalRecipients = campaign.totalRecipients ?? 0;
                      const sentCount = campaign.events?.filter((e) => e.eventType === "sent").length ?? 0;
                      const openCount = campaign.events?.filter((e) => e.eventType === "opened").length ?? 0;
                      const clickCount = campaign.events?.filter((e) => e.eventType === "clicked").length ?? 0;
                      const openRate = totalRecipients > 0 ? ((openCount / totalRecipients) * 100).toFixed(1) : "0.0";
                      const clickRate = totalRecipients > 0 ? ((clickCount / totalRecipients) * 100).toFixed(1) : "0.0";
                      const cfg = statusConfig[campaign.status];

                      return (
                        <tr
                          key={campaign.id}
                          className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          onClick={() => router.push(`/dashboard/newsletter/campaigns/${campaign.id}`)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <PenSquare className="h-4 w-4 text-zinc-400" />
                              {campaign.name}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="max-w-[200px] truncate px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">
                            {campaign.subject}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">
                            {sentCount} / {totalRecipients}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{openRate}%</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{clickRate}%</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => router.push(`/dashboard/newsletter/campaigns/${campaign.id}`)}
                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => duplicateMutation.mutate(campaign.id)}
                                disabled={duplicateMutation.isPending}
                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-blue-500 dark:hover:bg-zinc-800"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteId(campaign.id)}
                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Campaign</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this campaign? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
