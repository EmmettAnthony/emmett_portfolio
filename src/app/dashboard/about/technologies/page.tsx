"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";import type { AboutTechnologyFormData } from "@/lib/validations/about";
import { aboutTechnologySchema } from "@/lib/validations/about";
import {
  Wrench,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { AboutTechnologyFormData } from "@/lib/validations/about";

interface Technology {
  id: string;
  name: string;
  category: string;
  logo: string | null;
  experienceLevel: string | null;
  order: number;
}

const CATEGORIES = ["Frontend", "Backend", "Database", "CMS", "Cloud", "Tools"];
const EXP_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function AboutTechnologiesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<AboutTechnologyFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(aboutTechnologySchema) as any,
    defaultValues: { name: "", category: "Frontend", logo: null, experienceLevel: null, order: 0 },
  });

  const { data, isLoading, error } = useQuery<{ technologies: Technology[] }>({
    queryKey: ["dashboard-about-technologies"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/about/technologies");
      if (!res.ok) throw new Error("Failed to fetch technologies");
      return res.json();
    },
  });

  const technologies = data?.technologies ?? [];
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: technologies.filter((t) => t.category === cat).sort((a, b) => a.order - b.order),
  }));

  const openAdd = () => {
    form.reset({ name: "", category: "Frontend", logo: null, experienceLevel: null, order: technologies.length });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (tech: Technology) => {
    form.reset({ name: tech.name, category: tech.category, logo: tech.logo, experienceLevel: tech.experienceLevel, order: tech.order });
    setEditingId(tech.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: AboutTechnologyFormData) => {
      const url = editingId ? `/api/dashboard/about/technologies/${editingId}` : "/api/dashboard/about/technologies";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save technology");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-about-technologies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-about"] });
      toast("success", editingId ? "Technology updated" : "Technology added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save technology"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/about/technologies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete technology");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-about-technologies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-about"] });
      toast("success", "Technology deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete technology"),
  });

  const onSubmit = (formData: AboutTechnologyFormData) => saveMutation.mutate(formData);

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent className="space-y-3">{Array.from({ length: 2 }).map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}</CardContent></Card>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <Wrench className="mb-3 h-10 w-10 text-red-400" />
      <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load technologies</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/about"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Technology Stack</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{technologies.length} total technologies</p>
          </div>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Technology</Button>
      </div>

      {technologies.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Wrench className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No technologies yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add technologies you work with to showcase your tech stack.</p>
          <Button className="mt-6" onClick={openAdd}><Plus className="h-4 w-4" />Add Technology</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.map((group) => (
            <Card key={group.category}>
              <CardHeader><CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">{group.category} <Badge variant="secondary" className="ml-2 text-xs">{group.items.length}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {group.items.length === 0 && <p className="text-xs text-zinc-400">No technologies in this category</p>}
                {group.items.map((tech) => (
                  <div key={tech.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{tech.name}</p>
                      {tech.experienceLevel && <p className="text-xs text-zinc-400">{tech.experienceLevel}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(tech)} className="rounded p-1 text-zinc-400 hover:text-muted-foreground"><Edit3 className="h-3 w-3" /></button>
                      <button onClick={() => setDeleteId(tech.id)} className="rounded p-1 text-zinc-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{editingId ? "Edit Technology" : "Add Technology"}</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="React" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>                    {/* eslint-disable-next-line react-hooks/incompatible-library */}
                    <Select value={form.watch("category")} onValueChange={(v: string | null) => v && form.setValue("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={form.watch("experienceLevel") ?? ""} onValueChange={(v: string | null) => form.setValue("experienceLevel", v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    {EXP_LEVELS.map((lvl) => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input {...form.register("logo")} placeholder="https://example.com/react-logo.png" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Technology</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete this technology?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
