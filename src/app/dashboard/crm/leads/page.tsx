"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONTACTED: "bg-badge-warning-bg text-badge-warning-text",
  QUALIFIED: "bg-purple-500/10 text-purple-400",
  PROPOSAL_SENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  NEGOTIATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const SOURCES = ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "EMAIL", "PHONE", "EVENT", "OTHER"];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  leadScore: number;
  createdAt: string;
}

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
}

const emptyForm: LeadFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "WEBSITE",
  status: "NEW",
};

export default function CrmLeadsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<LeadFormData>(emptyForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-leads", page, search, statusFilter, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(sourceFilter !== "ALL" && { source: sourceFilter }),
      });
      const res = await fetch(`/api/dashboard/crm/leads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const res = await fetch("/api/dashboard/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast("success", "Lead created");
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => toast("error", "Failed to create lead"),
  });

  const leads: Lead[] = data?.leads ?? [];
  const totalPages = data?.totalPages ?? 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Leads</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {data?.total ?? 0} total leads
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search leads..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "ALL"); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v ?? "ALL"); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sources</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">No leads found.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                      <a href={`/dashboard/crm/leads/${lead.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                        {lead.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{lead.email}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{lead.phone || "\u2014"}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{lead.company || "\u2014"}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{lead.source.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", STATUS_COLORS[lead.status])}>
                        {lead.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        lead.leadScore >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        lead.leadScore >= 50 ? "bg-badge-warning-bg text-badge-warning-text" :
                        "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400"
                      )}>
                        {lead.leadScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Lead</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name *</label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Email *</label>
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Phone</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Company</label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    {Object.keys(STATUS_COLORS).map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
