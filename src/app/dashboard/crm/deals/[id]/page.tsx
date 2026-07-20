"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STAGE_COLORS: Record<string, string> = {
  LEAD: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground",
  QUALIFIED: "bg-purple-500/10 text-purple-400",
  PROPOSAL_SENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  NEGOTIATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STAGES = ["LEAD", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
}

interface DealDetail {
  id: string;
  name: string;
  value: number;
  probability: number;
  stage: string;
  expectedClose: string;
  notes: string | null;
  createdAt: string;
  clientName: string;
  clientId: string;
  activities: Activity[];
  tasks: Task[];
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ name: "", value: "", probability: "", stage: "", expectedClose: "", notes: "" });

  const { data: deal, isLoading } = useQuery<DealDetail>({
    queryKey: ["crm-deal", id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/crm/deals/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/dashboard/crm/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-deal", id] });
      toast("success", "Deal updated");
      setShowEdit(false);
    },
    onError: () => toast("error", "Failed to update"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!deal) {
    return <div className="py-16 text-center text-sm text-zinc-500">Deal not found.</div>;
  }

  const currentStageIdx = STAGES.indexOf(deal.stage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{deal.name}</h1>
            <a href={`/dashboard/crm/clients/${deal.clientId}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">{deal.clientName}</a>
          </div>
          <Badge className={cn(STAGE_COLORS[deal.stage])}>{deal.stage.replace(/_/g, " ")}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          setEditForm({ name: deal.name, value: String(deal.value), probability: String(deal.probability), stage: deal.stage, expectedClose: deal.expectedClose || "", notes: deal.notes || "" });
          setShowEdit(true);
        }}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stage Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {STAGES.filter((s) => s !== "LOST").map((stage, i) => {
              const completed = i <= currentStageIdx;
              const isActive = i === currentStageIdx;
              return (
                <React.Fragment key={stage}>
                  {i > 0 && <div className={cn("h-1 flex-1 rounded", completed ? "bg-blue-500" : "bg-zinc-200 dark:bg-zinc-700")} />}
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    completed ? "bg-blue-500 text-white" : isActive ? "ring-2 ring-blue-500 bg-white text-blue-600 dark:bg-zinc-800" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  )}>
                    {i + 1}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            {STAGES.filter((s) => s !== "LOST").map((stage) => (
              <span key={stage}>{stage.replace(/_/g, " ")}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deal Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Value</span><span className="font-medium text-zinc-900 dark:text-white">${deal.value.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Probability</span><span className="font-medium text-zinc-900 dark:text-white">{deal.probability}%</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Stage</span><Badge className={cn(STAGE_COLORS[deal.stage])}>{deal.stage.replace(/_/g, " ")}</Badge></div>
              <div className="flex justify-between"><span className="text-zinc-500">Expected Close</span><span className="font-medium text-zinc-900 dark:text-white">{deal.expectedClose ? new Date(deal.expectedClose).toLocaleDateString() : "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Created</span><span className="font-medium text-zinc-900 dark:text-white">{new Date(deal.createdAt).toLocaleDateString()}</span></div>
            </div>
            {deal.notes && <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50"><p className="text-sm text-muted-foreground dark:text-zinc-400">{deal.notes}</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Tasks ({deal.tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {deal.tasks.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No tasks.</div>
            ) : (
              <div className="space-y-2">
                {deal.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{task.title}</p>
                      <p className="text-xs text-zinc-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        task.priority === "URGENT" ? "border-red-500 text-red-500" :
                        task.priority === "HIGH" ? "border-amber-500 text-amber-500" :
                        task.priority === "MEDIUM" ? "border-blue-500 text-blue-500" :
                        "border-zinc-500 text-zinc-500"
                      )}>{task.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{task.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {deal.activities.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-500">No activity yet.</div>
          ) : (
            <div className="space-y-3">
              {deal.activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
                  <Badge variant="outline" className="text-xs">{a.type}</Badge>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-700 dark:text-muted-foreground">{a.description}</p>
                    <p className="text-xs text-zinc-500">{new Date(a.createdAt).toLocaleString()}</p>
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
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Edit Deal</h3>
              <button onClick={() => setShowEdit(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editForm); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Value</label>
                  <Input type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Probability %</label>
                  <Input type="number" min={0} max={100} value={editForm.probability} onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Stage</label>
                  <select value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    {STAGES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Expected Close</label>
                  <Input type="date" value={editForm.expectedClose} onChange={(e) => setEditForm({ ...editForm, expectedClose: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Notes</label>
                <textarea rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowEdit(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
