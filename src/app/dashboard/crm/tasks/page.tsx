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

const PRIORITY_BADGES: Record<string, string> = {
  LOW: "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HIGH: "bg-badge-warning-bg text-badge-warning-text",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
  relatedTo: string | null;
  relatedType: string | null;
}

interface TaskFormData {
  title: string;
  dueDate: string;
  priority: string;
  status: string;
  relatedId: string;
  relatedType: string;
}

const emptyForm: TaskFormData = { title: "", dueDate: "", priority: "MEDIUM", status: "PENDING", relatedId: "", relatedType: "" };

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-tasks", statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(priorityFilter !== "ALL" && { priority: priorityFilter }),
      });
      const res = await fetch(`/api/dashboard/crm/tasks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await fetch("/api/dashboard/crm/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-tasks"] }); toast("success", "Task created"); setShowModal(false); setForm(emptyForm); },
    onError: () => toast("error", "Failed to create task"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/dashboard/crm/tasks/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["crm-tasks"] }); toast("success", "Task updated"); },
    onError: () => toast("error", "Failed to update task"),
  });

  const tasks: Task[] = data?.tasks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500">{data?.total ?? 0} total</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowModal(true); }}><Plus className="h-4 w-4" /> Add Task</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                statusFilter === s ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              )}>{s.replace(/_/g, " ")}</button>
          ))}
        </div>
        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                priorityFilter === p ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              )}>{p}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">No tasks found.</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.status === "COMPLETED"}
                  onChange={() => statusMutation.mutate({ id: task.id, status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" })}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
                />
                <div>
                  <p className={cn("text-sm font-medium", task.status === "COMPLETED" ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-white")}>{task.title}</p>
                  <p className="text-xs text-zinc-500">
                    {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    {task.relatedTo && <span className="ml-2">{task.relatedType}: {task.relatedTo}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn(PRIORITY_BADGES[task.priority])}>{task.priority}</Badge>
                <Badge variant="outline" className="text-xs">{task.status.replace(/_/g, " ")}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Task</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Title *</label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Due Date</label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Related Type</label>
                  <select value={form.relatedType} onChange={(e) => setForm({ ...form, relatedType: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    <option value="">None</option>
                    <option value="LEAD">Lead</option>
                    <option value="CLIENT">Client</option>
                    <option value="DEAL">Deal</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Related ID</label>
                <Input value={form.relatedId} onChange={(e) => setForm({ ...form, relatedId: e.target.value })} />
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
