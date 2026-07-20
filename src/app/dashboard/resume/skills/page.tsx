"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";import type { SkillFormData } from "@/lib/validations/resume";
import { skillSchema } from "@/lib/validations/resume";
import {
  Wrench,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { SkillFormData } from "@/lib/validations/resume";

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  yearsOfExperience: number | null;
  order: number;
}

const CATEGORIES = ["Frontend", "Backend", "Database", "CMS", "Tools", "Other"];

export default function SkillsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProficiency, setEditingProficiency] = useState<string | null>(null);

  const form = useForm<SkillFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(skillSchema) as any,
    defaultValues: {
      name: "",
      category: "Other",
      proficiency: 50,
      yearsOfExperience: null,
      order: 0,
    },
  });

  const { data, isLoading, error } = useQuery<{ skills: Skill[] }>({
    queryKey: ["dashboard-resume-skills"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/skills");
      if (!res.ok) throw new Error("Failed to fetch skills");
      return res.json();
    },
  });

  const skills = data?.skills ?? [];

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    skills: skills.filter((s) => s.category === cat).sort((a, b) => a.order - b.order),
  }));

  const openAdd = () => {
    form.reset({ name: "", category: "Other", proficiency: 50, yearsOfExperience: null, order: skills.length });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (skill: Skill) => {
    form.reset({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      yearsOfExperience: skill.yearsOfExperience,
      order: skill.order,
    });
    setEditingId(skill.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: SkillFormData) => {
      const url = editingId ? `/api/dashboard/resume/skills/${editingId}` : "/api/dashboard/resume/skills";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save skill");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-skills"] });
      toast("success", editingId ? "Skill updated" : "Skill added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save skill"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/skills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete skill");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-skills"] });
      toast("success", "Skill deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete skill"),
  });

  const proficiencyMutation = useMutation({
    mutationFn: async ({ id, proficiency }: { id: string; proficiency: number }) => {
      const skill = skills.find((s) => s.id === id);
      if (!skill) throw new Error("Skill not found");
      const res = await fetch(`/api/dashboard/resume/skills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...skill, proficiency }),
      });
      if (!res.ok) throw new Error("Failed to update proficiency");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-skills"] });
      toast("success", "Proficiency updated");
      setEditingProficiency(null);
    },
    onError: () => toast("error", "Failed to update proficiency"),
  });

  const moveItem = (catIndex: number, skillIndex: number, direction: "up" | "down") => {
    const cat = grouped[catIndex];
    if (!cat) return;
    const newIndex = direction === "up" ? skillIndex - 1 : skillIndex + 1;
    if (newIndex < 0 || newIndex >= cat.skills.length) return;
    const items = [...cat.skills];
    [items[skillIndex], items[newIndex]] = [items[newIndex], items[skillIndex]];
    const reordered = items.map((item, i) => ({ id: item.id, order: i }));
    Promise.all(
      reordered.map((item) => {
        const skill = skills.find((s) => s.id === item.id);
        return fetch(`/api/dashboard/resume/skills/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(skill ? { ...skill, order: item.order } : {}),
        });
      })
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-skills"] });
    }).catch(() => toast("error", "Failed to reorder"));
  };

  const onSubmit = (formData: SkillFormData) => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Wrench className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load skills</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Skills</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{skills.length} total skills</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {skills.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Wrench className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No skills yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add your professional skills to your resume.</p>
          <Button className="mt-6" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Skill
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.map((group, catIndex) => (
            <Card key={group.category}>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {group.category}
                  <Badge variant="secondary" className="ml-2 text-xs">{group.skills.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.skills.length === 0 && (
                  <p className="text-xs text-zinc-400">No skills in this category</p>
                )}
                {group.skills.map((skill, skillIndex) => (
                  <div key={skill.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveItem(catIndex, skillIndex, "up")} disabled={skillIndex === 0} className="text-zinc-400 hover:text-muted-foreground disabled:opacity-30 leading-none"><ArrowUp className="h-3 w-3" /></button>
                          <button onClick={() => moveItem(catIndex, skillIndex, "down")} disabled={skillIndex === group.skills.length - 1} className="text-zinc-400 hover:text-muted-foreground disabled:opacity-30 leading-none"><ArrowDown className="h-3 w-3" /></button>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{skill.name}</p>
                          {skill.yearsOfExperience != null && (
                            <p className="text-xs text-zinc-400">{skill.yearsOfExperience} yr{skill.yearsOfExperience !== 1 ? "s" : ""}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(skill)} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground"><Edit3 className="h-3 w-3" /></button>
                        <button onClick={() => setDeleteId(skill.id)} className="rounded-md p-1 text-zinc-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    {/* Proficiency Bar */}
                    <div className="relative">
                      <div
                        className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 cursor-pointer overflow-hidden"
                        onClick={() => setEditingProficiency(skill.id)}
                      >
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                      {editingProficiency === skill.id && (
                        <div className="absolute top-4 left-0 z-10 w-full">
                          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                            <Input
                              type="range"
                              min={0}
                              max={100}
                              defaultValue={skill.proficiency}
                              onChange={(e) => {
                                proficiencyMutation.mutate({ id: skill.id, proficiency: Number(e.target.value) });
                              }}
                              className="flex-1"
                            />
                            <span className="text-xs font-medium text-zinc-500 w-8 text-right">{skill.proficiency}%</span>
                          </div>
                        </div>
                      )}
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingId ? "Edit Skill" : "Add Skill"}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Skill Name</Label>
                <Input id="name" {...form.register("name")} placeholder="React" />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.watch("category")} // eslint-disable-line react-hooks/incompatible-library
                   
    onValueChange={(v: string | null) => v && form.setValue("category", v as SkillFormData["category"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proficiency">Proficiency ({form.watch("proficiency")}%)</Label>
                <Input
                  id="proficiency"
                  type="range"
                  min={0}
                  max={100}
                  {...form.register("proficiency", { valueAsNumber: true })}
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  {...form.register("yearsOfExperience", { valueAsNumber: true })}
                  placeholder="5"
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Skill</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete this skill?</p>
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
