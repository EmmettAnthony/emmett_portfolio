"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PLANNING: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REVIEW: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  budget: number | null;
  deadline: string | null;
  status: string;
  priority: string;
  clientId: string | null;
  client: Client | null;
  tags: string | null;
  createdAt: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  budget: string;
  deadline: string;
  status: string;
  priority: string;
  clientId: string;
  tags: string;
}

const emptyForm: ProjectFormData = {
  name: "",
  description: "",
  budget: "",
  deadline: "",
  status: "PLANNING",
  priority: "MEDIUM",
  clientId: "",
  tags: "",
};

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/projects?include=client");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json().then((d) => d.projects as Project[]);
    },
  });

  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json().then((d) => d.clients as Client[]);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ProjectFormData;
    }) => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeletingId(null);
    },
  });

  const projects = projectsData || [];
  const clients = clientsData || [];

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.client?.name || "").toLowerCase().includes(q)
    );
  });

  function closeModal() {
    setShowModal(false);
    setEditingProject(null);
    setForm(emptyForm);
  }

  function openAdd() {
    setEditingProject(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || "",
      budget: project.budget?.toString() || "",
      deadline: project.deadline
        ? new Date(project.deadline).toISOString().slice(0, 10)
        : "",
      status: project.status,
      priority: project.priority,
      clientId: project.clientId || "",
      tags: project.tags || "",
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {projects.length} Projects
        </h2>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          No projects found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Priority
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Client
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Budget
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Deadline
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                    {p.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        statusColors[p.status]
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        priorityColors[p.priority]
                      )}
                    >
                      {p.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                    {p.client?.name || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                    {p.budget != null
                      ? p.budget.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                    {p.deadline
                      ? new Date(p.deadline).toLocaleDateString()
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(p.id)}
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingProject ? "Edit Project" : "Add Project"}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                  Name *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                    Budget (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.budget}
                    onChange={(e) =>
                      setForm({ ...form, budget: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({ ...form, deadline: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                  Client
                </label>
                <select
                  value={form.clientId}
                  onChange={(e) =>
                    setForm({ ...form, clientId: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) =>
                    setForm({ ...form, tags: e.target.value })
                  }
                  placeholder="e.g. frontend, api, design"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {isPending
                    ? "Saving..."
                    : editingProject
                      ? "Update Project"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
              Delete Project
            </h3>
            <p className="mb-6 text-sm text-muted-foreground dark:text-zinc-400">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
