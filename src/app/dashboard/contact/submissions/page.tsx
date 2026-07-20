"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Mail,
  Phone,
  ExternalLink,
  Trash2,
  Eye,
  X,
  ArrowLeft,
  Search,
  ChevronDown,
  MessageCircle,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  UserPlus,
  Circle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Contact {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  projectType: string;
  budget: string | null;
  timeline: string | null;
  projectDetails: string;
  projectGoals: string | null;
  preferredContactMethod: string | null;
  referralSource: string | null;
  leadScore: number;
  status: string;
  notes: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  assignedTo: string | null;
  tags: string | null;
}

interface TimelineEntry {
  id: string;
  contactId: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

type SortKey = "newest" | "oldest" | "highest_score" | "lowest_score";

export default function ContactSubmissionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("NEW");

  const { data, isLoading, error } = useQuery<{ contacts: Contact[] }>({
    queryKey: ["dashboard-contact-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/contact-submissions");
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/contact-submissions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-contact-submissions"] });
      toast("success", "Submission deleted");
    },
    onError: () => toast("error", "Failed to delete submission"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/dashboard/contact-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-contact-submissions"] });
      toast("success", "Status updated");
    },
    onError: () => toast("error", "Failed to update status"),
  });

  const notesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await fetch(`/api/dashboard/contact-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-contact-submissions"] });
      toast("success", "Notes saved");
    },
    onError: () => toast("error", "Failed to save notes"),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assignedTo, tags }: { id: string; assignedTo?: string | null; tags?: string | null }) => {
      const body: Record<string, unknown> = {};
      if (assignedTo !== undefined) body.assignedTo = assignedTo;
      if (tags !== undefined) body.tags = tags;
      const res = await fetch(`/api/dashboard/contact-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-contact-submissions"] });
      toast("success", "Lead updated");
    },
    onError: () => toast("error", "Failed to update lead"),
  });

  const batchMutation = useMutation({
    mutationFn: async ({
      action,
      ids,
      status,
    }: {
      action: "updateStatus" | "delete";
      ids: string[];
      status?: string;
    }) => {
      const res = await fetch(
        "/api/dashboard/contact-submissions/batch",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ids, status }),
        }
      );
      if (!res.ok) throw new Error("Batch operation failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-contact-submissions"],
      });
      setSelectedIds(new Set());
      toast("success", `Batch operation completed on ${data.count} submissions`);
    },
    onError: () => toast("error", "Batch operation failed"),
  });

  const { data: timelineData, isLoading: timelineLoading } = useQuery<TimelineEntry[]>({
    queryKey: ["contact-timeline", selected?.id],
    queryFn: async () => {
      if (!selected?.id) return [];
      const res = await fetch(`/api/dashboard/contact-submissions/${selected.id}/timeline`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    enabled: !!selected,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.size} selected submissions?`)) return;
    batchMutation.mutate({
      action: "delete",
      ids: Array.from(selectedIds),
    });
  };

  const handleBulkStatusUpdate = () => {
    batchMutation.mutate({
      action: "updateStatus",
      ids: Array.from(selectedIds),
      status: bulkStatus,
    });
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Company", "Project Type", "Budget", "Timeline", "Status", "Lead Score", "Date"];
    const rows = filtered.map((c) => [
      c.fullName, c.email, c.phone || "", c.company || "", c.projectType,
      c.budget || "", c.timeline || "", c.status, String(c.leadScore),
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contact-submissions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("success", `${filtered.length} submissions exported`);
  };

  const filtered = (data?.contacts ?? [])
    .filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.projectType.toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false) ||
        (c.assignedTo?.toLowerCase().includes(q) ?? false) ||
        (c.tags?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "highest_score":
          return b.leadScore - a.leadScore;
        case "lowest_score":
          return a.leadScore - b.leadScore;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <MessageCircle className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load submissions</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CONTACTED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    QUALIFIED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PROPOSAL_SENT: "bg-purple-500/10 text-purple-400",
    NEGOTIATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    WON: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-zinc-500 dark:text-zinc-400";
  };

  const timelineIcon = (action: string) => {
    switch (action) {
      case "STATUS_CHANGE":
        return RefreshCw;
      case "NOTE_ADDED":
        return FileText;
      case "BOOKING_CREATED":
        return Calendar;
      case "CONTACT_CREATED":
        return UserPlus;
      default:
        return Circle;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Contact Submissions</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filtered.length} submission{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or project..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_score">Highest Score</option>
            <option value="lowest_score">Lowest Score</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-muted-foreground dark:hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 -mx-2 rounded-2xl border border-blue-200 bg-blue-50/90 px-4 py-3 backdrop-blur-sm dark:border-blue-800 dark:bg-blue-950/80">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring dark:border-blue-700 dark:bg-blue-900/50 dark:text-white"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                <option value="NEGOTIATION">NEGOTIATION</option>
                <option value="WON">WON</option>
                <option value="LOST">LOST</option>
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={batchMutation.isPending}
                className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                Update Status
              </button>
            </div>
            <button
              onClick={handleBulkDelete}
              disabled={batchMutation.isPending}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={batchMutation.isPending}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-20 dark:border-zinc-700">
          <Mail className="mb-3 h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {search || statusFilter !== "all" ? "No matching submissions" : "No submissions yet"}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {search || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Contact form submissions will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select-all header */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-3 px-1 py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select all
                </span>
              </label>
            </div>
          )}
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(contact.id)}
                    onChange={(e) => handleSelectOne(contact.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600"
                  />
                  <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {contact.fullName}
                    </h3>
                    <select
                      value={contact.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        statusMutation.mutate({
                          id: contact.id,
                          status: e.target.value,
                        })
                      }
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border-0 appearance-none cursor-pointer",
                        statusColors[contact.status] || "bg-zinc-100 text-muted-foreground dark:bg-zinc-800"
                      )}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                      <option value="NEGOTIATION">NEGOTIATION</option>
                      <option value="WON">WON</option>
                      <option value="LOST">LOST</option>
                    </select>
                    <span className={cn("text-xs font-semibold", scoreColor(contact.leadScore))}>
                      Score: {contact.leadScore}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-4 flex-wrap text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                    {contact.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                    {contact.company && (
                      <span>{contact.company}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {contact.projectType}
                    </span>
                    {contact.budget && (
                      <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {contact.budget}
                      </span>
                    )}
                    {contact.timeline && (
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                        {contact.timeline}
                      </span>
                    )}
                    {contact.assignedTo && (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                        {contact.assignedTo}
                      </span>
                    )}
                    {contact.tags?.split(",").map((tag) => (
                      <span key={tag.trim()} className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400 line-clamp-2">
                    {contact.projectDetails}
                  </p>
                </div>
              </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSelected(contact)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this submission?"))
                        deleteMutation.mutate(contact.id);
                    }}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-10"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Submission Details
                </h2>
                <select
                  value={selected.status}
                  onChange={(e) => {
                    statusMutation.mutate({
                      id: selected.id,
                      status: e.target.value,
                    });
                    setSelected({ ...selected, status: e.target.value });
                  }}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border-0 appearance-none cursor-pointer",
                    statusColors[selected.status] || "bg-zinc-100 text-muted-foreground"
                  )}
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                  <option value="WON">WON</option>
                  <option value="LOST">LOST</option>
                </select>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Name</p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-white">{selected.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Email</p>
                  <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.email}</p>
                </div>
                {selected.phone && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Phone</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.phone}</p>
                  </div>
                )}
                {selected.company && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Company</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.company}</p>
                  </div>
                )}
              </div>

              <hr className="border-zinc-200 dark:border-zinc-700" />

              {/* Project Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Project Type</p>
                  <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.projectType}</p>
                </div>
                {selected.budget && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Budget</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.budget}</p>
                  </div>
                )}
                {selected.timeline && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Timeline</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.timeline}</p>
                  </div>
                )}
                {selected.preferredContactMethod && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Preferred Contact</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.preferredContactMethod}</p>
                  </div>
                )}
                {selected.referralSource && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Referral Source</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.referralSource}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Lead Score</p>
                  <p className={cn("mt-0.5 text-sm font-semibold", scoreColor(selected.leadScore))}>
                    {selected.leadScore}/100
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Assigned To</p>
                  <input
                    type="text"
                    defaultValue={selected.assignedTo ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (selected.assignedTo ?? "")) {
                        assignMutation.mutate({ id: selected.id, assignedTo: e.target.value || null });
                        setSelected({ ...selected, assignedTo: e.target.value });
                      }
                    }}
                    placeholder="Unassigned"
                    className="mt-0.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Tags</p>
                  <input
                    type="text"
                    defaultValue={selected.tags ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (selected.tags ?? "")) {
                        assignMutation.mutate({ id: selected.id, tags: e.target.value || null });
                        setSelected({ ...selected, tags: e.target.value });
                      }
                    }}
                    placeholder="e.g. hot-lead, enterprise, follow-up"
                    className="mt-0.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {selected.projectGoals && (
                <>
                  <hr className="border-zinc-200 dark:border-zinc-700" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Project Goals</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{selected.projectGoals}</p>
                  </div>
                </>
              )}

              <hr className="border-zinc-200 dark:border-zinc-700" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Project Details</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400 whitespace-pre-wrap">
                  {selected.projectDetails}
                </p>
              </div>

              {selected.fileUrl && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Attached File</p>
                  <a
                    href={selected.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Download className="h-4 w-4" />
                    {selected.fileName || "Download file"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <hr className="border-zinc-200 dark:border-zinc-700" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1">Internal Notes</p>
                <textarea
                  defaultValue={selected.notes ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (selected.notes ?? "")) {
                      notesMutation.mutate({ id: selected.id, notes: e.target.value });
                      setSelected({ ...selected, notes: e.target.value });
                    }
                  }}
                  rows={3}
                  placeholder="Add internal notes about this lead..."
                  className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
                />
              </div>

              <hr className="border-zinc-200 dark:border-zinc-700" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">Timeline</p>
                {timelineLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                    ))}
                  </div>
                ) : !timelineData || timelineData.length === 0 ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">No timeline entries yet.</p>
                ) : (
                  <div className="space-y-3">
                    {timelineData.map((entry) => {
                      const Icon = timelineIcon(entry.action);
                      return (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-zinc-100 p-1.5 dark:bg-zinc-800">
                            <Icon className="h-3.5 w-3.5 text-zinc-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-700 dark:text-muted-foreground">{entry.detail}</p>
                            <p className="text-xs text-zinc-400">
                              <Clock className="mr-1 inline h-3 w-3" />
                              {new Date(entry.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-xs text-zinc-400">
                Submitted {new Date(selected.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
