"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  healthScore: number;
  projectsCount: number;
  createdAt: string;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  notes: string;
}

const emptyForm: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  notes: "",
};

export default function CrmClientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-clients", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search });
      const res = await fetch(`/api/dashboard/crm/clients?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const res = await fetch("/api/dashboard/crm/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-clients"] });
      toast("success", "Client created");
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => toast("error", "Failed to create client"),
  });

  const clients: Client[] = data?.clients ?? [];
  const totalPages = data?.totalPages ?? 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Clients</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data?.total ?? 0} total clients</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search clients..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">No clients found.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Health Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Projects</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                      <a href={`/dashboard/crm/clients/${client.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                        {client.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{client.email}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{client.phone || "\u2014"}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{client.company || "\u2014"}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        client.healthScore >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        client.healthScore >= 50 ? "bg-badge-warning-bg text-badge-warning-text" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {client.healthScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{client.projectsCount}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Client</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name *</label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Email *</label>
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Phone</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Company</label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Website</label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Create Client</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
