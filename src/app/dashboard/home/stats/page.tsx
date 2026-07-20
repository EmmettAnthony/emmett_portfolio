"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { homepageStatisticSchema, type HomepageStatisticFormData } from "@/lib/validations/homepage";
import { BarChart3, Plus, Edit3, Trash2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function HomeStatsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<HomepageStatisticFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type compat
    resolver: zodResolver(homepageStatisticSchema) as any,
    defaultValues: { title: "", value: "", icon: null, order: 0 },
  });

  const { data, isLoading } = useQuery<{ stats: Record<string, unknown>[] }>({
    queryKey: ["dashboard-homepage-stats"],
    queryFn: async () => { const res = await fetch("/api/dashboard/home/stats"); if (!res.ok) throw new Error(); return res.json(); },
  });

  const stats = data?.stats ?? [];

  const saveMutation = useMutation({
    mutationFn: async (formData: HomepageStatisticFormData) => {
      const url = editingId ? `/api/dashboard/home/stats/${editingId}` : "/api/dashboard/home/stats";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dashboard-homepage-stats"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-homepage"] }); toast("success", editingId ? "Updated" : "Added"); setShowForm(false); setEditingId(null); },
    onError: () => toast("error", "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/dashboard/home/stats/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dashboard-homepage-stats"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-homepage"] }); toast("success", "Deleted"); setDeleteId(null); },
    onError: () => toast("error", "Failed to delete"),
  });

  const openAdd = () => { form.reset({ title: "", value: "", icon: null, order: stats.length }); setEditingId(null); setShowForm(true); };
  const openEdit = (s: Record<string, unknown>) => { form.reset({ title: s.title as string, value: s.value as string, icon: s.icon as string | null, order: s.order as number }); setEditingId(s.id as string); setShowForm(true); };
  const onSubmit = (formData: HomepageStatisticFormData) => saveMutation.mutate(formData);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-32" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/home"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div><h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Homepage Statistics</h1><p className="mt-1 text-sm text-zinc-500">{stats.length} total</p></div>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Stat</Button>
      </div>

      {stats.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No stats yet</h3>
          <Button className="mt-6" onClick={openAdd}><Plus className="h-4 w-4" />Add Stat</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat: Record<string, unknown>) => (
            <Card key={stat.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-zinc-500">{stat.title}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(stat)} className="rounded p-1.5 text-zinc-400 hover:text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(stat.id)} className="rounded p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{editingId ? "Edit" : "Add"} Statistic</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input {...form.register("title")} placeholder="Projects Completed" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Value</Label><Input {...form.register("value")} placeholder="500" /></div>
                <div className="space-y-2"><Label>Icon</Label><Input {...form.register("icon")} placeholder="briefcase, users" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{editingId ? "Update" : "Create"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Delete Statistic</h2>
            <p className="mt-2 text-sm text-zinc-500">Are you sure?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">{deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
