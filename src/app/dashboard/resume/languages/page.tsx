"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";import type { LanguageFormData } from "@/lib/validations/resume";
import { languageSchema } from "@/lib/validations/resume";
import { cn } from "@/lib/utils";
import {
  Plus, Edit3, Trash2, Loader2, ArrowUp, ArrowDown, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { LanguageFormData } from "@/lib/validations/resume";

interface Language {
  id: string;
  language: string;
  proficiency: string;
  order: number;
}

const PROFICIENCIES = ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"];

const PROFICIENCY_COLORS: Record<string, string> = {
  Beginner: "bg-zinc-100 text-muted-foreground dark:bg-zinc-800",
  Intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Advanced: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Fluent: "bg-badge-warning-bg text-badge-warning-text",
  Native: "bg-purple-500/10 text-purple-400",
};

export default function LanguagesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<LanguageFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(languageSchema) as any,
    defaultValues: {
      language: "",
      proficiency: "Native",
      order: 0,
    },
  });

  const { data, isLoading, error } = useQuery<{ languages: Language[] }>({
    queryKey: ["dashboard-resume-languages"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/languages");
      if (!res.ok) throw new Error("Failed to fetch languages");
      return res.json();
    },
  });

  const languages = data?.languages ?? [];

  const openAdd = () => {
    form.reset({ language: "", proficiency: "Native", order: languages.length });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (lang: Language) => {
    form.reset({
      language: lang.language,
      proficiency: lang.proficiency as LanguageFormData["proficiency"],
      order: lang.order,
    });
    setEditingId(lang.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: LanguageFormData) => {
      const url = editingId ? `/api/dashboard/resume/languages/${editingId}` : "/api/dashboard/resume/languages";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save language");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-languages"] });
      toast("success", editingId ? "Language updated" : "Language added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save language"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/languages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete language");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-languages"] });
      toast("success", "Language deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete language"),
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= languages.length) return;
    const items = [...languages];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    Promise.all(
      items.map((item, i) => {
        const original = languages.find((l) => l.id === item.id);
        return fetch(`/api/dashboard/resume/languages/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(original ? { ...original, order: i } : {}),
        });
      })
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-languages"] });
    }).catch(() => toast("error", "Failed to reorder"));
  };

  const onSubmit = (formData: LanguageFormData) => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Globe className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load languages</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Languages</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{languages.length} total languages</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Language
        </Button>
      </div>

      {languages.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No languages yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add languages you speak to your resume.</p>
          <Button className="mt-6" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Language
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((lang, index) => (
            <Card key={lang.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-muted-foreground dark:bg-zinc-800">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">{lang.language}</h3>
                    <Badge variant="outline" className={cn("mt-0.5 text-xs", PROFICIENCY_COLORS[lang.proficiency])}>
                      {lang.proficiency}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                  <button onClick={() => moveItem(index, "down")} disabled={index === languages.length - 1} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                  <button onClick={() => openEdit(lang)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteId(lang.id)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
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
              {editingId ? "Edit Language" : "Add Language"}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input id="language" {...form.register("language")} placeholder="English" />
                {form.formState.errors.language && <p className="text-xs text-red-500">{form.formState.errors.language.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="proficiency">Proficiency</Label>
                <Select
                  value={form.watch("proficiency")} // eslint-disable-line react-hooks/incompatible-library
                   
    onValueChange={(v: string | null) => v && form.setValue("proficiency", v as LanguageFormData["proficiency"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select proficiency" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFICIENCIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Language</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete this language?</p>
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
