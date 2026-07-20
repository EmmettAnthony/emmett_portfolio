"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  ACTIVE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE:
    "bg-badge-warning-bg text-badge-warning-text",
  PAST: "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400",
};

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  notes: string | null;
  avatar: string | null;
  status: string;
  createdAt: string;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  notes: string;
  status: string;
}

const emptyForm: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  notes: "",
  status: "ACTIVE",
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json().then((d) => d.clients as Client[]);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ClientFormData;
    }) => {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeletingId(null);
    },
  });

  const clients = data || [];
  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q)
    );
  });

  function closeModal() {
    setShowModal(false);
    setEditingClient(null);
    setForm(emptyForm);
  }

  function openAdd() {
    setEditingClient(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      company: client.company || "",
      website: client.website || "",
      notes: client.notes || "",
      status: client.status,
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {clients.length} Clients
        </h2>
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">
          No clients found.
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
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Company
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                    {c.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                    {c.company || "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        statusColors[c.status]
                      )}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(c.id)}
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
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingClient ? "Edit Client" : "Add Client"}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                  Website
                </label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
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
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="PAST">PAST</option>
                </select>
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
                    : editingClient
                      ? "Update Client"
                      : "Create Client"}
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
              Delete Client
            </h3>
            <p className="mb-6 text-sm text-muted-foreground dark:text-zinc-400">
              Are you sure you want to delete this client? This action cannot be
              undone.
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
