"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ACTIVITY_TYPES = ["NOTE", "EMAIL", "CALL", "MEETING", "TASK", "PROPOSAL"];

interface Activity {
  id: string;
  type: string;
  description: string;
  leadName: string | null;
  clientName: string | null;
  dealName: string | null;
  createdAt: string;
}

interface ActivityFormData {
  type: string;
  description: string;
  leadId: string;
  clientId: string;
  dealId: string;
}

const emptyForm: ActivityFormData = {
  type: "NOTE",
  description: "",
  leadId: "",
  clientId: "",
  dealId: "",
};

export default function ActivitiesPage() {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ActivityFormData>(emptyForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-activities", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ ...(typeFilter !== "ALL" && { type: typeFilter }) });
      const res = await fetch(`/api/dashboard/crm/activities?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const res = await fetch("/api/dashboard/crm/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      toast("success", "Activity added");
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => toast("error", "Failed to add activity"),
  });

  const activities: Activity[] = data?.activities ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Activities</h1>
          <p className="mt-1 text-sm text-zinc-500">{data?.total ?? 0} total activities</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Add Activity
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["ALL", ...ACTIVITY_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              typeFilter === t
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            )}
          >
            {t === "ALL" ? "All" : t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : activities.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">No activities found.</div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <Badge variant="outline" className="mt-0.5 text-xs shrink-0">{a.type}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-700 dark:text-muted-foreground">{a.description}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {[a.leadName && `Lead: ${a.leadName}`, a.clientName && `Client: ${a.clientName}`, a.dealName && `Deal: ${a.dealName}`].filter(Boolean).join(" \u00B7 ")}
                  <span className="ml-2">{new Date(a.createdAt).toLocaleString()}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Activity</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Description *</label>
                <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Lead ID (optional)</label>
                  <Input value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} placeholder="Lead ID" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Client ID (optional)</label>
                  <Input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="Client ID" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Deal ID (optional)</label>
                <Input value={form.dealId} onChange={(e) => setForm({ ...form, dealId: e.target.value })} placeholder="Deal ID" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Create Activity</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
