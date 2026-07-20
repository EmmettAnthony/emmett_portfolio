"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Loader2, CheckCircle2, Circle, Clock, AlertCircle, ArrowUp, Trash2, Edit3 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createTaskSchema } from "@/lib/validations/calendar";
import type { z } from "zod";
import type { CalendarTask } from "@/types/calendar";

type TaskFormData = z.input<typeof createTaskSchema>;

const defaultTaskValues: TaskFormData = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  category: "",
  status: "PENDING",
  progress: 0,
  order: 0,
  color: "#8b5cf6",
};

const PRIORITY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  LOW: { icon: <ArrowUp className="h-3 w-3 rotate-180" />, color: "text-zinc-400" },
  MEDIUM: { icon: <ArrowUp className="h-3 w-3" />, color: "text-blue-500" },
  HIGH: { icon: <AlertCircle className="h-3 w-3" />, color: "text-amber-500" },
  URGENT: { icon: <AlertCircle className="h-3 w-3" />, color: "text-red-500" },
};

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];

export default function CalendarTasksPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: defaultTaskValues,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-tasks", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "100");
      const res = await fetch(`/api/calendar/tasks?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await fetch("/api/calendar/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast("success", "Task created");
      resetForm();
    },
    onError: () => toast("error", "Failed to create task"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<TaskFormData>) => {
      const res = await fetch(`/api/calendar/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast("success", "Task updated");
    },
    onError: () => toast("error", "Failed to update task"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] });
      toast("success", "Task deleted");
    },
    onError: () => toast("error", "Failed to delete"),
  });

  const resetForm = () => {
    reset(defaultTaskValues);
    setEditingTask(null);
    setShowForm(false);
  };

  const onSubmit = (data: TaskFormData) => {
    if (editingTask) {
      // Don't overwrite status/progress/order when editing — managed by kanban UI
      const { status: _, progress: _p, order: _o, ...rest } = data;
      updateMutation.mutate({ id: editingTask.id, ...rest, dueDate: data.dueDate || null, category: data.category || null });
    } else {
      createMutation.mutate({ ...data, dueDate: data.dueDate || null, category: data.category || null });
    }
  };

  const tasks: CalendarTask[] = data?.tasks || [];
  const groupedTasks = STATUSES.map((status) => ({
    status,
    tasks: tasks.filter((t: CalendarTask) => t.status === status),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..." className="w-56 rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500" />
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* Task Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  {...register("title")}
                  placeholder="Task title..."
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 aria-[invalid=true]:border-red-500"
                  aria-invalid={errors.title ? "true" : "false"}
                />
                {errors.title && <p className="absolute -bottom-5 left-0 text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <select
                {...register("priority")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <input
                type="date"
                {...register("dueDate")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button type="submit" disabled={isSubmitting || createMutation.isPending}
                className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50">
                {editingTask ? "Update" : "Add"}
              </button>
              <button type="button" onClick={resetForm}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
            </div>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Description (optional)..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </form>
        </motion.div>
      )}

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {groupedTasks.map(({ status, tasks: statusTasks }) => (
            <div key={status} className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {status === "COMPLETED" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                   status === "IN_PROGRESS" ? <Clock className="h-4 w-4 text-blue-500" /> :
                   <Circle className="h-4 w-4 text-zinc-400" />}
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white capitalize">{status.replace("_", " ")}</span>
                </div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">{statusTasks.length}</span>
              </div>
              <div className="space-y-2 p-3 min-h-[200px]">
                {statusTasks.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400 py-4">No tasks</p>
                ) : (
                  statusTasks.map((task: CalendarTask, i: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-all hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => {
                              const newStatus: CalendarTask["status"] = task.status === "COMPLETED" ? "PENDING" :
                                task.status === "PENDING" ? "IN_PROGRESS" : "COMPLETED";
                              updateMutation.mutate({ id: task.id, status: newStatus });
                            }}
                            className="mt-0.5 text-zinc-400 hover:text-green-500 transition-colors"
                          >
                            {task.status === "COMPLETED" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4" />}
                          </button>
                          <div>
                            <p className={cn("text-sm font-medium text-zinc-900 dark:text-white", task.status === "COMPLETED" && "line-through text-zinc-400")}>
                              {task.title}
                            </p>
                            {task.description && <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{task.description}</p>}
                            {task.dueDate && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">
                                <Clock className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className={cn("text-[10px]", PRIORITY_CONFIG[task.priority]?.color || "text-zinc-400")}>
                            {PRIORITY_CONFIG[task.priority]?.icon}
                          </span>
                          <button onClick={() => { setEditingTask(task); reset({ title: task.title, description: task.description || "", priority: task.priority as TaskFormData["priority"], dueDate: task.dueDate || "", category: task.category || "" }); setShowForm(true); }}
                            className="rounded p-0.5 text-zinc-400 hover:text-muted-foreground dark:hover:text-muted-foreground">
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button onClick={() => { if (confirm("Delete this task?")) deleteMutation.mutate(task.id); }}
                            className="rounded p-0.5 text-zinc-400 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
