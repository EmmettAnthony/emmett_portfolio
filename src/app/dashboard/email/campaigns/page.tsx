"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Send,
  Plus,
  Search,
  Copy,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  content: string;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  template?: { id: string; name: string } | null;
  segment?: { id: string; name: string } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  SENDING: { label: "Sending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  SENT: { label: "Sent", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  CANCELLED: { label: "Cancelled", color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
  PAUSED: { label: "Paused", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/email/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email/campaigns?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast("success", "Campaign deleted");
      setDeleteId(null);
    },
    onError: (err) => toast("error", `Failed to delete: ${err.message}`),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email/campaigns/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast("success", "Campaign duplicated");
    },
    onError: (err) => toast("error", `Failed to duplicate: ${err.message}`),
  });

  const filtered = campaigns?.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create and manage email marketing campaigns
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/email/campaigns/new")}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          {Object.entries(statusConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
              <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            </div>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((campaign) => {
            const status = statusConfig[campaign.status] || statusConfig.DRAFT;
            const StatusIcon = campaign.status === "SENT" ? CheckCircle 
              : campaign.status === "SCHEDULED" ? Clock
              : campaign.status === "FAILED" ? XCircle
              : Send;
            return (
              <div
                key={campaign.id}
                className="group cursor-pointer rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                onClick={() => router.push(`/dashboard/email/campaigns/${campaign.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn("rounded-lg p-2", status.color)}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{campaign.name}</h3>
                      <p className="mt-0.5 text-sm text-zinc-500">{campaign.subject}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium", status.color)}>
                          {status.label}
                        </span>
                        {campaign.scheduledAt && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                            <Clock className="h-3 w-3" />
                            {new Date(campaign.scheduledAt).toLocaleString()}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400">
                          Created {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateMutation.mutate(campaign.id);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(campaign.id);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Send className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium text-zinc-500">No campaigns yet</p>
          <p className="mt-1 text-sm">Create your first email campaign to get started.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/email/campaigns/new")}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-500">
            Are you sure you want to delete this campaign? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
