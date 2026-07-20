"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";import type { EducationFormData } from "@/lib/validations/resume";
import { educationSchema } from "@/lib/validations/resume";
import {
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { EducationFormData } from "@/lib/validations/resume";

interface Education {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  grade: string | null;
  description: string | null;
  order: number;
}

export default function EducationPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<EducationFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(educationSchema) as any,
    defaultValues: {
      institution: "",
      degree: null,
      fieldOfStudy: null,
      startDate: "",
      endDate: null,
      grade: null,
      description: null,
      order: 0,
    },
  });

  const { data, isLoading, error } = useQuery<{ education: Education[] }>({
    queryKey: ["dashboard-resume-education"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/education");
      if (!res.ok) throw new Error("Failed to fetch education");
      return res.json();
    },
  });

  const educationList = data?.education ?? [];

  const openAdd = () => {
    form.reset({
      institution: "",
      degree: null,
      fieldOfStudy: null,
      startDate: "",
      endDate: null,
      grade: null,
      description: null,
      order: educationList.length,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (edu: Education) => {
    form.reset({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate ? edu.startDate.split("T")[0] : "",
      endDate: edu.endDate ? edu.endDate.split("T")[0] : null,
      grade: edu.grade,
      description: edu.description,
      order: edu.order,
    });
    setEditingId(edu.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: EducationFormData) => {
      const url = editingId
        ? `/api/dashboard/resume/education/${editingId}`
        : "/api/dashboard/resume/education";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save education");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-education"] });
      toast("success", editingId ? "Education updated" : "Education added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save education"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/education/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete education");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-education"] });
      toast("success", "Education deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete education"),
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= educationList.length) return;
    const items = [...educationList];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    const reordered = items.map((item, i) => ({ id: item.id, order: i }));
    Promise.all(
      reordered.map((item) => {
        const original = educationList.find((e) => e.id === item.id);
        return fetch(`/api/dashboard/resume/education/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(original ? { ...original, order: item.order } : {}),
        });
      })
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-education"] });
    }).catch(() => toast("error", "Failed to reorder"));
  };

  const onSubmit = (formData: EducationFormData) => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <GraduationCap className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load education</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Education</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{educationList.length} total entries</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Education
        </Button>
      </div>

      {educationList.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No education yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add your educational background to your resume.</p>
          <Button className="mt-6" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Education
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {educationList.map((edu, index) => (
            <Card key={edu.id} className="relative">
              {index < educationList.length - 1 && (
                <div className="absolute left-[31px] top-14 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />
              )}
              <CardContent className="flex gap-4 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{edu.institution}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" in ") || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => moveItem(index, "down")} disabled={index === educationList.length - 1} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button onClick={() => openEdit(edu)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(edu.id)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(edu.startDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                      {" — "}
                      {edu.endDate ? new Date(edu.endDate).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "Present"}
                    </span>
                    {edu.grade && (
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{edu.grade}</span>
                    )}
                  </div>
                  {edu.description && (
                    <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400">{edu.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingId ? "Edit Education" : "Add Education"}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" {...form.register("institution")} placeholder="University of Technology" />
                {form.formState.errors.institution && (
                  <p className="text-xs text-red-500">{form.formState.errors.institution.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  <Input id="degree" {...form.register("degree")} placeholder="Bachelor of Science" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input id="fieldOfStudy" {...form.register("fieldOfStudy")} placeholder="Computer Science" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...form.register("startDate")} />
                  {form.formState.errors.startDate && (
                    <p className="text-xs text-red-500">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" {...form.register("endDate")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input id="grade" {...form.register("grade")} placeholder="3.8 GPA / First Class" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  {...form.register("description")}
                  placeholder="Relevant coursework, activities..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                >
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Education</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this education entry? This action cannot be undone.
            </p>
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
