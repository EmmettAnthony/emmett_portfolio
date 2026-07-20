"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Eye, MessageSquare, ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import { updateServiceInquirySchema } from "@/lib/validations/services";
import type { ServiceInquiry, InquiryStatus } from "@/types/services";

interface InquiriesResponse {
  inquiries: ServiceInquiry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusConfig: Record<InquiryStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  CONTACTED: { label: "Contacted", color: "bg-badge-warning-bg text-badge-warning-text" },
  QUALIFIED: { label: "Qualified", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  NEGOTIATION: { label: "Negotiation", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CONVERTED: { label: "Converted", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CLOSED: { label: "Closed", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground" },
  LOST: { label: "Lost", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const statuses: InquiryStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "CONVERTED", "CLOSED", "LOST"];

export default function InquiriesPage() {

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedInquiry, setSelectedInquiry] = useState<ServiceInquiry | null>(null);
  const [updateStatus, setUpdateStatus] = useState<InquiryStatus | "">("");

  const { data, isLoading, error } = useQuery<InquiriesResponse>({
    queryKey: ["dashboard-service-inquiries", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "20", ...(statusFilter !== "all" && { status: statusFilter }) });
      const res = await fetch(`/api/dashboard/services/inquiries?${params}`);
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await fetch(`/api/dashboard/services/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update inquiry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service-inquiries"] });
      toast("success", "Status updated");
      setUpdateStatus("");
      setSelectedInquiry(null);
    },
    onError: () => toast("error", "Failed to update status"),
  });

  const handleStatusUpdate = () => {
    if (!selectedInquiry || !updateStatus) return;
    const result = updateServiceInquirySchema.safeParse({ status: updateStatus });
    if (!result.success) {
      toast("error", "Invalid status");
      return;
    }
    updateMutation.mutate({ id: selectedInquiry.id, data: result.data });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <MessageSquare className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load inquiries</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Inquiries</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data?.total ?? 0} total inquiries</p>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", ...statuses] as const).map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "border border-zinc-300 text-muted-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            {status === "all" ? "All" : statusConfig[status].label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : data?.inquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No inquiries found"
          description={statusFilter !== "all" ? "No inquiries with this status." : "No service inquiries yet."}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data?.inquiries.map((inquiry) => {
                  const cfg = statusConfig[inquiry.status];
                  return (
                    <tr
                      key={inquiry.id}
                      className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      onClick={() => { setSelectedInquiry(inquiry); setUpdateStatus(""); }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">{inquiry.fullName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{inquiry.email}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{inquiry.service?.title ?? inquiry.serviceName ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{inquiry.budget ?? "—"}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setSelectedInquiry(inquiry); setUpdateStatus(""); }}
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">Page {data.page} of {data.totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Inquiry Details</h2>
              <button onClick={() => setSelectedInquiry(null)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Name</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{selectedInquiry.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Email</p>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{selectedInquiry.email}</p>
                </div>
                {selectedInquiry.phone && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Phone</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{selectedInquiry.phone}</p>
                  </div>
                )}
                {selectedInquiry.company && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Company</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{selectedInquiry.company}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Service</p>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{selectedInquiry.service?.title ?? selectedInquiry.serviceName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Budget</p>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{selectedInquiry.budget ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Status</p>
                  <span className={cn("mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusConfig[selectedInquiry.status].color)}>
                    {statusConfig[selectedInquiry.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Date</p>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Message</p>
                <p className="text-sm text-zinc-700 dark:text-muted-foreground whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">{selectedInquiry.message}</p>
              </div>

              {/* Status Update */}
              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">Update Status</p>
                <div className="flex items-center gap-3">
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as InquiryStatus)}
                    className="flex-1 rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">Select status...</option>
                    {statuses.map((s) => (
                      <option key={s} value={s}>{statusConfig[s].label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!updateStatus || updateMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                  >
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
