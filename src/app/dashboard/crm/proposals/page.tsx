"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_BADGES: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface Proposal {
  id: string;
  number: string;
  title: string;
  clientName: string;
  total: number;
  status: string;
  sentDate: string | null;
  approvedDate: string | null;
}

interface ProposalFormData {
  title: string;
  clientId: string;
  total: string;
  status: string;
}

const emptyForm: ProposalFormData = { title: "", clientId: "", total: "", status: "DRAFT" };

export default function ProposalsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ProposalFormData>(emptyForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-proposals", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(statusFilter !== "ALL" && { status: statusFilter }) });
      const res = await fetch(`/api/dashboard/crm/proposals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProposalFormData) => {
      const res = await fetch("/api/dashboard/crm/proposals", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-proposals"] }); toast("success", "Proposal created"); setShowModal(false); setForm(emptyForm); },
    onError: () => toast("error", "Failed to create proposal"),
  });

  const proposals: Proposal[] = data?.proposals ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Proposals</h1>
          <p className="mt-1 text-sm text-zinc-500">{data?.total ?? 0} total</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowModal(true); }}><Plus className="h-4 w-4" /> Add Proposal</Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["ALL", "DRAFT", "SENT", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              statusFilter === s ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            )}>{s}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : proposals.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">No proposals found.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Number</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Sent</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Approved</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground dark:text-zinc-400">{p.number}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{p.clientName}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">${p.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", STATUS_BADGES[p.status])}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{p.sentDate ? new Date(p.sentDate).toLocaleDateString() : "\u2014"}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{p.approvedDate ? new Date(p.approvedDate).toLocaleDateString() : "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Proposal</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Title *</label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Client ID</label>
                  <Input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Total *</label>
                  <Input required type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
