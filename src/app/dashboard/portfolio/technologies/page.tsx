"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Plus, X, Edit3, Trash2, Loader2, Code2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent
} from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Tech {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  category: string | null;
}

interface TechForm {
  name: string;
  slug: string;
  icon: string;
  color: string;
  category: string;
}

const TECH_CATEGORIES = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "database", label: "Database" },
  { value: "devops", label: "DevOps" },
  { value: "mobile", label: "Mobile" },
  { value: "other", label: "Other" },
];

const defaultForm: TechForm = { name: "", slug: "", icon: "", color: "", category: "" };

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function PortfolioTechnologiesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tech | null>(null);
  const [form, setForm] = useState<TechForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TechForm, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-portfolio-technologies"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/portfolio/technologies");
      if (!res.ok) throw new Error("Failed to fetch technologies");
      return res.json() as Promise<{ technologies: Tech[] }>;
    },
  });

  const technologies = data?.technologies ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<TechForm>) => {
      const res = await fetch("/api/dashboard/portfolio/technologies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio-technologies"] });
      toast("success", "Technology created");
      closeModal();
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: payload }: { id: string; data: Partial<TechForm> }) => {
      const res = await fetch(`/api/dashboard/portfolio/technologies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio-technologies"] });
      toast("success", "Technology updated");
      closeModal();
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/portfolio/technologies/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to delete"); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio-technologies"] });
      toast("success", "Technology deleted");
      setDeleteId(null);
      setDeleteError("");
    },
    onError: (err: Error) => { setDeleteError(err.message); },
  });

  const updateField = (key: keyof TechForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(tech: Tech) {
    setEditing(tech);
    setForm({
      name: tech.name,
      slug: tech.slug,
      icon: tech.icon ?? "",
      color: tech.color ?? "",
      category: tech.category ?? "",
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
  }

  function handleSubmit() {
    const errors: Partial<Record<keyof TechForm, string>> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.slug.trim()) errors.slug = "Slug is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Partial<TechForm> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      icon: form.icon.trim() || undefined,
      color: form.color.trim() || undefined,
      category: form.category || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Code2 className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load technologies</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Technologies</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{technologies.length} total technologies</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Technology
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : technologies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Code2 className="mb-3 h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No technologies yet. Create your first one!</p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="h-4 w-4" />
              Add Technology
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Color</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {technologies.map((tech) => (
                  <tr key={tech.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tech.icon && <span className="text-lg">{tech.icon}</span>}
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">{tech.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-zinc-500 dark:text-zinc-400">{tech.slug}</td>
                    <td className="px-6 py-4">
                      {tech.category && (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground">
                          {tech.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tech.color ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-4 w-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: tech.color }} />
                          <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">{tech.color}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(tech)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteId(tech.id); setDeleteError(""); }} className="hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editing ? "Edit Technology" : "Add Technology"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    updateField("name", name);
                    if (!editing) updateField("slug", slugify(name));
                  }}
                  className={cn(formErrors.name && "border-red-400")}
                  placeholder="e.g. React"
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Slug *</label>
                <Input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className={cn("font-mono", formErrors.slug && "border-red-400")}
                  placeholder="react"
                />
                {formErrors.slug && <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Category</label>
                <Select value={form.category} onValueChange={(value) => updateField("category", value ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECH_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Icon</label>
                  <Input
                    value={form.icon}
                    onChange={(e) => updateField("icon", e.target.value)}
                    placeholder="e.g. ⚛️"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Color</label>
                  <div className="flex gap-2">
                    <Input
                      value={form.color}
                      onChange={(e) => updateField("color", e.target.value)}
                      placeholder="#61DAFB"
                    />
                    {form.color && (
                      <span className="mt-1.5 inline-block h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: form.color }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setDeleteId(null); setDeleteError(""); }}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Technology</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this technology? This action cannot be undone.
            </p>
            {deleteError && <p className="mt-2 text-sm text-red-500">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteId(null); setDeleteError(""); }}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
