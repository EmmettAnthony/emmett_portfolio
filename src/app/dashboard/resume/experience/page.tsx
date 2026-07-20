"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  experienceSchema, type ExperienceFormData,
} from "@/lib/validations/resume";
import {
  Briefcase, Plus, Edit3, Trash2, Loader2, ArrowUp, ArrowDown,
  ChevronRight, Calendar, MapPin, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  employmentType: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  order: number;
}

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Freelance", "Internship"];

export default function ExperiencePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<ExperienceFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(experienceSchema) as any,
    defaultValues: {
      jobTitle: "",
      company: "",
      employmentType: "Full-Time",
      location: null,
      startDate: "",
      endDate: null,
      current: false,
      responsibilities: [],
      achievements: [],
      technologies: [],
      order: 0,
    },
  });      // eslint-disable-next-line react-hooks/incompatible-library
      const watchCurrent = form.watch("current");

  const { data, isLoading, error } = useQuery<{ experiences: Experience[] }>({
    queryKey: ["dashboard-resume-experiences"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/experience");
      if (!res.ok) throw new Error("Failed to fetch experiences");
      return res.json();
    },
  });

  const experiences = data?.experiences ?? [];

  const openAdd = () => {
    form.reset({
      jobTitle: "",
      company: "",
      employmentType: "Full-Time",
      location: null,
      startDate: "",
      endDate: null,
      current: false,
      responsibilities: [],
      achievements: [],
      technologies: [],
      order: experiences.length,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (exp: Experience) => {
    form.reset({
      jobTitle: exp.jobTitle,
      company: exp.company,
      employmentType: exp.employmentType as ExperienceFormData["employmentType"],
      location: exp.location,
      startDate: exp.startDate ? exp.startDate.split("T")[0] : "",
      endDate: exp.endDate ? exp.endDate.split("T")[0] : null,
      current: exp.current,
      responsibilities: exp.responsibilities,
      achievements: exp.achievements,
      technologies: exp.technologies,
      order: exp.order,
    });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: ExperienceFormData) => {
      const url = editingId
        ? `/api/dashboard/resume/experience/${editingId}`
        : "/api/dashboard/resume/experience";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save experience");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-experiences"] });
      toast("success", editingId ? "Experience updated" : "Experience added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save experience"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/experience/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete experience");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-experiences"] });
      toast("success", "Experience deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete experience"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; order: number }[]) => {
      await Promise.all(
        items.map((item) =>
          fetch(`/api/dashboard/resume/experience/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              experiences.find((e) => e.id === item.id)
            ),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-experiences"] });
    },
    onError: () => toast("error", "Failed to reorder"),
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= experiences.length) return;
    const items = [...experiences];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    const reordered = items.map((item, i) => ({ id: item.id, order: i }));
    reorderMutation.mutate(reordered);
  };

  const onSubmit = (formData: ExperienceFormData) => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Briefcase className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load experiences</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Experience</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{experiences.length} total experiences</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Experience
        </Button>
      </div>

      {experiences.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No experience yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add your first work experience to your resume.</p>
          <Button className="mt-6" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        </div>
      ) : (
        /* Timeline */
        <div className="space-y-3">
          {experiences.map((exp, index) => (
            <Card key={exp.id} className="relative">
              {/* Timeline line */}
              {index < experiences.length - 1 && (
                <div className="absolute left-[31px] top-14 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />
              )}
              <CardContent className="flex gap-4 p-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Briefcase className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{exp.jobTitle}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{exp.company}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === experiences.length - 1}
                        className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(exp)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(exp.id)}
                        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <Badge variant="secondary" className="text-xs">
                      {exp.employmentType}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(exp.startDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                      {" — "}
                      {exp.current ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : ""}
                    </span>
                    {exp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {exp.location}
                      </span>
                    )}
                    {exp.current && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        Current
                      </Badge>
                    )}
                  </div>
                  {exp.responsibilities.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground dark:text-zinc-400">
                          <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-zinc-400" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                  {exp.technologies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {exp.technologies.map((t, i) => (
                        <span key={i} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingId ? "Edit Experience" : "Add Experience"}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input id="jobTitle" {...form.register("jobTitle")} placeholder="Senior Developer" />
                  {form.formState.errors.jobTitle && (
                    <p className="text-xs text-red-500">{form.formState.errors.jobTitle.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" {...form.register("company")} placeholder="Acme Corp" />
                  {form.formState.errors.company && (
                    <p className="text-xs text-red-500">{form.formState.errors.company.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={form.watch("employmentType")}
                  onValueChange={(v: string | null) => v && form.setValue("employmentType", v as ExperienceFormData["employmentType"])}
                >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...form.register("location")} placeholder="San Francisco, CA" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...form.register("startDate")} />
                  {form.formState.errors.startDate && (
                    <p className="text-xs text-red-500">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register("endDate")}
                    disabled={watchCurrent}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={watchCurrent}
                  onClick={() => form.setValue("current", !watchCurrent)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    watchCurrent ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                      watchCurrent ? "translate-x-[22px]" : "translate-x-[2px]"
                    )}
                  />
                </button>
                <Label htmlFor="current">I currently work here</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
                <Textarea
                  id="responsibilities"
                  rows={4}
                  value={(form.watch("responsibilities") ?? []).join("\n")}
                  onChange={(e) => form.setValue("responsibilities", e.target.value.split("\n").filter(Boolean))}
                  placeholder="Lead development team&#10;Architected microservices&#10;Managed CI/CD pipeline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="achievements">Achievements (one per line)</Label>
                <Textarea
                  id="achievements"
                  rows={3}
                  value={(form.watch("achievements") ?? []).join("\n")}
                  onChange={(e) => form.setValue("achievements", e.target.value.split("\n").filter(Boolean))}
                  placeholder="Increased performance by 40%&#10;Won internal hackathon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                <Input
                  id="technologies"
                  value={(form.watch("technologies") ?? []).join(", ")}
                  onChange={(e) => form.setValue("technologies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="React, Node.js, TypeScript, PostgreSQL"
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

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Experience</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this experience? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
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
