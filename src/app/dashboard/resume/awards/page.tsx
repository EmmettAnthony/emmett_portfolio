"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  awardSchema, type AwardFormData,
} from "@/lib/validations/resume";
import {
  Star, Plus, Edit3, Trash2, Loader2, ArrowUp, ArrowDown,
  Calendar, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Award {
  id: string;
  title: string;
  organization: string | null;
  date: string | null;
  description: string | null;
  order: number;
}

export default function AwardsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<AwardFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(awardSchema) as any,
    defaultValues: {
      title: "",
      organization: null,
      date: null,
      description: null,
      order: 0,
    },
  });

  const { data, isLoading, error } = useQuery<{ awards: Award[] }>({
    queryKey: ["dashboard-resume-awards"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/awards");
      if (!res.ok) throw new Error("Failed to fetch awards");
      return res.json();
    },
  });

  const awards = data?.awards ?? [];

  const openAdd = () => {
    form.reset({ title: "", organization: null, date: null, description: null, order: awards.length });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (award: Award) => {
    form.reset({
      title: award.title,
      organization: award.organization,
      date: award.date ? award.date.split("T")[0] : null,
      description: award.description,
      order: award.order,
    });
    setEditingId(award.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: AwardFormData) => {
      const url = editingId ? `/api/dashboard/resume/awards/${editingId}` : "/api/dashboard/resume/awards";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save award");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-awards"] });
      toast("success", editingId ? "Award updated" : "Award added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save award"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/awards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete award");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-awards"] });
      toast("success", "Award deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete award"),
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= awards.length) return;
    const items = [...awards];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    Promise.all(
      items.map((item, i) => {
        const original = awards.find((a) => a.id === item.id);
        return fetch(`/api/dashboard/resume/awards/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(original ? { ...original, order: i } : {}),
        });
      })
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-awards"] });
    }).catch(() => toast("error", "Failed to reorder"));
  };

  const onSubmit = (formData: AwardFormData) => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Star className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load awards</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Awards</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{awards.length} total awards</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Award
        </Button>
      </div>

      {awards.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No awards yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add your awards and recognitions.</p>
          <Button className="mt-6" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Award
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {awards.map((award, index) => (
            <Card key={award.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{award.title}</h3>
                      {award.organization && (
                        <p className="text-xs text-zinc-500">{award.organization}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                    <button onClick={() => moveItem(index, "down")} disabled={index === awards.length - 1} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                    <button onClick={() => openEdit(award)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(award.id)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {award.date && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(award.date).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                  </p>
                )}
                {award.description && (
                  <p className="mt-1.5 text-sm text-muted-foreground dark:text-zinc-400">{award.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingId ? "Edit Award" : "Add Award"}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Award Title</Label>
                <Input id="title" {...form.register("title")} placeholder="Employee of the Year" />
                {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" {...form.register("organization")} placeholder="Company Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...form.register("date")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} {...form.register("description")} placeholder="Description of the award..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Award</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete this award?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
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
