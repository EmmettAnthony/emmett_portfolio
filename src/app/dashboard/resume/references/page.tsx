"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";import type { ReferenceFormData } from "@/lib/validations/resume";
import { referenceSchema } from "@/lib/validations/resume";
import {
  Users, Plus, Edit3, Trash2, Loader2, ArrowUp, ArrowDown,
  Mail, Phone, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { ReferenceFormData } from "@/lib/validations/resume";

interface Reference {
  id: string;
  name: string;
  position: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  isPublic: boolean;
  order: number;
}

export default function ReferencesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<ReferenceFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(referenceSchema) as any,
    defaultValues: {
      name: "",
      position: null,
      organization: null,
      email: null,
      phone: null,
      isPublic: true,
      order: 0,
    },
  });

  const { data, isLoading, error } = useQuery<{ references: Reference[] }>({
    queryKey: ["dashboard-resume-references"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/references");
      if (!res.ok) throw new Error("Failed to fetch references");
      return res.json();
    },
  });

  const references = data?.references ?? [];

  const openAdd = () => {
    form.reset({ name: "", position: null, organization: null, email: null, phone: null, isPublic: true, order: references.length });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (ref: Reference) => {
    form.reset({
      name: ref.name,
      position: ref.position,
      organization: ref.organization,
      email: ref.email,
      phone: ref.phone,
      isPublic: ref.isPublic,
      order: ref.order,
    });
    setEditingId(ref.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: ReferenceFormData) => {
      const url = editingId ? `/api/dashboard/resume/references/${editingId}` : "/api/dashboard/resume/references";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save reference");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-references"] });
      toast("success", editingId ? "Reference updated" : "Reference added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save reference"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/references/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reference");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-references"] });
      toast("success", "Reference deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete reference"),
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= references.length) return;
    const items = [...references];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    Promise.all(
      items.map((item, i) => {
        const original = references.find((r) => r.id === item.id);
        return fetch(`/api/dashboard/resume/references/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(original ? { ...original, order: i } : {}),
        });
      })
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-references"] });
    }).catch(() => toast("error", "Failed to reorder"));
  };

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const ref = references.find((r) => r.id === id);
      if (!ref) throw new Error("Reference not found");
      const res = await fetch(`/api/dashboard/resume/references/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ref, isPublic }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-references"] });
    },
    onError: () => toast("error", "Failed to update visibility"),
  });

  const onSubmit = (formData: ReferenceFormData) => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Users className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load references</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">References</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{references.length} total references</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Reference
        </Button>
      </div>

      {references.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Users className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No references yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add professional references to your resume.</p>
          <Button className="mt-6" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Reference
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {references.map((ref, index) => (
            <Card key={ref.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-muted-foreground dark:bg-zinc-800">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{ref.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {[ref.position, ref.organization].filter(Boolean).join(" at ") || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                    <button onClick={() => moveItem(index, "down")} disabled={index === references.length - 1} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                    <button onClick={() => openEdit(ref)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(ref.id)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  {ref.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {ref.email}
                    </span>
                  )}
                  {ref.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {ref.phone}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility.mutate({ id: ref.id, isPublic: !ref.isPublic })}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                      ref.isPublic
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    )}
                  >
                    {ref.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {ref.isPublic ? "Public" : "Private"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingId ? "Edit Reference" : "Add Reference"}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...form.register("name")} placeholder="Jane Smith" />
                {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" {...form.register("position")} placeholder="Engineering Manager" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" {...form.register("organization")} placeholder="Acme Corp" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} placeholder="jane@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...form.register("phone")} placeholder="+1 (555) 123-4567" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.watch("isPublic")}                    // eslint-disable-next-line react-hooks/incompatible-library
                    onClick={() => form.setValue("isPublic", !form.watch("isPublic"))}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    form.watch("isPublic") ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                      form.watch("isPublic") ? "translate-x-[22px]" : "translate-x-[2px]"
                    )}
                  />
                </button>
                <Label htmlFor="isPublic">Public reference (visible on resume)</Label>
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Reference</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete this reference?</p>
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
