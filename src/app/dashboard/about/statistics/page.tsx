"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aboutStatisticSchema, type AboutStatisticFormData } from "@/lib/validations/about";
import { BarChart3, Plus, Edit3, Trash2, Loader2, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Statistic {
  id: string;
  title: string;
  value: string;
  suffix: string | null;
  icon: string | null;
  order: number;
}

export default function AboutStatisticsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<AboutStatisticFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(aboutStatisticSchema) as any,
    defaultValues: { title: "", value: "", suffix: null, icon: null, order: 0 },
  });

  const { data, isLoading, error } = useQuery<{ statistics: Statistic[] }>({
    queryKey: ["dashboard-about-statistics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/about/statistics");
      if (!res.ok) throw new Error("Failed to fetch statistics");
      return res.json();
    },
  });

  const statistics = data?.statistics ?? [];

  const openAdd = () => {
    form.reset({ title: "", value: "", suffix: null, icon: null, order: statistics.length });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (stat: Statistic) => {
    form.reset({ title: stat.title, value: stat.value, suffix: stat.suffix, icon: stat.icon, order: stat.order });
    setEditingId(stat.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: AboutStatisticFormData) => {
      const url = editingId ? `/api/dashboard/about/statistics/${editingId}` : "/api/dashboard/about/statistics";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save statistic");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-about-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-about"] });
      toast("success", editingId ? "Statistic updated" : "Statistic added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save statistic"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/about/statistics/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete statistic");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-about-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-about"] });
      toast("success", "Statistic deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete statistic"),
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= statistics.length) return;
    const items = [...statistics];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    items.forEach((item, i) => {
      fetch(`/api/dashboard/about/statistics/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, order: i }),
      });
    });
    queryClient.invalidateQueries({ queryKey: ["dashboard-about-statistics"] });
  };

  const onSubmit = (formData: AboutStatisticFormData) => saveMutation.mutate(formData);

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <BarChart3 className="mb-3 h-10 w-10 text-red-400" />
      <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load statistics</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/about"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Statistics</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{statistics.length} total statistics</p>
          </div>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Statistic</Button>
      </div>

      {statistics.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No statistics yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add statistics like &quot;Projects Completed&quot; or &quot;Happy Clients&quot;.</p>
          <Button className="mt-6" onClick={openAdd}><Plus className="h-4 w-4" />Add Statistic</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statistics.map((stat, index) => (
            <Card key={stat.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                      {stat.value}
                      {stat.suffix && <span className="text-blue-500">{stat.suffix}</span>}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 truncate">{stat.title}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="rounded p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveItem(index, "down")} disabled={index === statistics.length - 1} className="rounded p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => openEdit(stat)} className="rounded p-1.5 text-zinc-400 hover:text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(stat.id)} className="rounded p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {stat.icon && <p className="mt-2 text-xs text-zinc-400">Icon: {stat.icon}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{editingId ? "Edit Statistic" : "Add Statistic"}</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...form.register("title")} placeholder="Projects Completed" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input {...form.register("value")} placeholder="500" />
                </div>
                <div className="space-y-2">
                  <Label>Suffix</Label>
                  <Input {...form.register("suffix")} placeholder="+" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon (emoji or name)</Label>
                <Input {...form.register("icon")} placeholder="code, users, trophy" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">
                  Cancel
                </button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Statistic</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete this statistic?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
