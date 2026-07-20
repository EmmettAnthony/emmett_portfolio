"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X, ArrowLeft, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONTACTED: "bg-badge-warning-bg text-badge-warning-text",
  QUALIFIED: "bg-purple-500/10 text-purple-400",
  PROPOSAL_SENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  NEGOTIATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  leadScore: number;
  notes: string | null;
  createdAt: string;
  activities: Activity[];
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });
  const [showDelete, setShowDelete] = useState(false);
  const [newActivity, setNewActivity] = useState("");
  const [newActivityType, setNewActivityType] = useState("NOTE");

  const { data: lead, isLoading, error } = useQuery<Lead>({
    queryKey: ["crm-lead", id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/crm/leads/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/dashboard/crm/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-lead", id] });
      toast("success", "Lead updated");
      setShowEdit(false);
    },
    onError: () => toast("error", "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/crm/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast("success", "Lead deleted");
      router.push("/dashboard/crm/leads");
    },
    onError: () => toast("error", "Failed to delete"),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await fetch(`/api/dashboard/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-lead", id] });
      toast("success", "Status updated");
    },
    onError: () => toast("error", "Failed to update status"),
  });

  const activityMutation = useMutation({
    mutationFn: async (data: { type: string; description: string }) => {
      const res = await fetch(`/api/dashboard/crm/leads/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add activity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-lead", id] });
      toast("success", "Activity added");
      setNewActivity("");
      setNewActivityType("NOTE");
    },
    onError: () => toast("error", "Failed to add activity"),
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/crm/leads/${id}/convert`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to convert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-lead", id] });
      toast("success", "Lead converted to client");
    },
    onError: () => toast("error", "Failed to convert"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">Lead not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{lead.name}</h1>
            <p className="text-sm text-zinc-500">{lead.email}</p>
          </div>
          <Badge className={cn(STATUS_COLORS[lead.status])}>{lead.status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditForm({ name: lead.name, email: lead.email, phone: lead.phone || "", company: lead.company || "", notes: lead.notes || "" }); setShowEdit(true); }}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDelete(true)} className="text-red-500">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-zinc-500">Email:</span> {lead.email}</div>
              <div><span className="font-medium text-zinc-500">Phone:</span> {lead.phone || "N/A"}</div>
              <div><span className="font-medium text-zinc-500">Company:</span> {lead.company || "N/A"}</div>
              <div><span className="font-medium text-zinc-500">Source:</span> {lead.source.replace(/_/g, " ")}</div>
              <div><span className="font-medium text-zinc-500">Lead Score:</span> {lead.leadScore}</div>
              <div><span className="font-medium text-zinc-500">Created:</span> {new Date(lead.createdAt).toLocaleDateString()}</div>
            </div>
            {lead.notes && (
              <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <p className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{lead.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Change Status</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(STATUS_COLORS).map((s) => (
                  <button
                    key={s}
                    onClick={() => statusMutation.mutate(s)}
                    disabled={lead.status === s || statusMutation.isPending}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium transition-all",
                      lead.status === s
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => convertMutation.mutate()}
                disabled={convertMutation.isPending || lead.status === "WON" || lead.status === "LOST"}
              >
                <UserCheck className="h-4 w-4" /> Convert to Client
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <select
              value={newActivityType}
              onChange={(e) => setNewActivityType(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="NOTE">Note</option>
              <option value="EMAIL">Email</option>
              <option value="CALL">Call</option>
              <option value="MEETING">Meeting</option>
            </select>
            <Input
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Add activity..."
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newActivity.trim()) {
                  activityMutation.mutate({ type: newActivityType, description: newActivity });
                }
              }}
              disabled={!newActivity.trim() || activityMutation.isPending}
            >
              Add
            </Button>
          </div>
          {lead.activities.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">No activities recorded.</div>
          ) : (
            <div className="space-y-4">
              {lead.activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
                  <Badge variant="outline" className="mt-0.5 text-xs">{a.type}</Badge>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-700 dark:text-muted-foreground">{a.description}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Edit Lead</h3>
              <button onClick={() => setShowEdit(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editForm); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name</label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Email</label>
                  <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Phone</label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Company</label>
                  <Input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowEdit(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Lead</h3>
            <p className="mt-2 text-sm text-zinc-500">Are you sure? This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
