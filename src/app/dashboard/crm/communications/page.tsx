"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COMM_TYPES = ["EMAIL", "PHONE", "SMS", "LETTER", "SOCIAL"];
const DIRECTIONS = ["INBOUND", "OUTBOUND"];

interface Communication {
  id: string;
  subject: string;
  type: string;
  direction: string;
  leadName: string | null;
  clientName: string | null;
  createdAt: string;
}

interface CommFormData {
  subject: string;
  body: string;
  type: string;
  direction: string;
  leadId: string;
  clientId: string;
}

const emptyForm: CommFormData = {
  subject: "",
  body: "",
  type: "EMAIL",
  direction: "OUTBOUND",
  leadId: "",
  clientId: "",
};

export default function CommunicationsPage() {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CommFormData>(emptyForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-communications", page, typeFilter, directionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(typeFilter !== "ALL" && { type: typeFilter }), ...(directionFilter !== "ALL" && { direction: directionFilter }) });
      const res = await fetch(`/api/dashboard/crm/communications?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CommFormData) => {
      const res = await fetch("/api/dashboard/crm/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-communications"] });
      toast("success", "Communication logged");
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => toast("error", "Failed to log communication"),
  });

  const comms: Communication[] = data?.communications ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Communications</h1>
          <p className="mt-1 text-sm text-zinc-500">{data?.total ?? 0} total</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Log Communication
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", ...COMM_TYPES].map((t) => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                typeFilter === t ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >{t === "ALL" ? "All" : t}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {["ALL", ...DIRECTIONS].map((d) => (
            <button key={d} onClick={() => { setDirectionFilter(d); setPage(1); }}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                directionFilter === d ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >{d === "ALL" ? "All" : d}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : comms.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">No communications found.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Direction</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Related To</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {comms.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{c.subject}</td>
                    <td className="px-4 py-3"><span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", c.type === "EMAIL" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : c.type === "PHONE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : c.type === "SMS" ? "bg-purple-500/10 text-purple-400" : "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400")}>{c.type}</span></td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{c.direction}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{c.leadName || c.clientName || "\u2014"}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{new Date(c.createdAt).toLocaleDateString()}</td>
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
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Log Communication</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Subject *</label>
                <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Body</label>
                <textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {COMM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Direction</label>
                  <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Lead ID</label>
                  <Input value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Client ID</label>
                  <Input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Log</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
