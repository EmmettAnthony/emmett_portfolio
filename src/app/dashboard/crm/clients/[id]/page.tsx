"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, X, Mail, Phone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  expectedClose: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
}

interface Contract {
  id: string;
  name: string;
  value: number;
  status: string;
  startDate: string;
  endDate: string | null;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  dueDate: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  notes: string | null;
  healthScore: number;
  createdAt: string;
  deals: Deal[];
  projects: Project[];
  contracts: Contract[];
  invoices: Invoice[];
  activities: Activity[];
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", company: "", website: "", notes: "" });
  const [showDelete, setShowDelete] = React.useState(false);
  const [newActivity, setNewActivity] = React.useState("");

  const { data: client, isLoading } = useQuery<ClientDetail>({
    queryKey: ["crm-client", id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/crm/clients/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch(`/api/dashboard/crm/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-client", id] });
      toast("success", "Client updated");
      setShowEdit(false);
    },
    onError: () => toast("error", "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/crm/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast("success", "Client deleted");
      router.push("/dashboard/crm/clients");
    },
    onError: () => toast("error", "Failed to delete"),
  });

  const activityMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await fetch(`/api/dashboard/crm/clients/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "NOTE", description }),
      });
      if (!res.ok) throw new Error("Failed to add activity");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-client", id] });
      toast("success", "Activity added");
      setNewActivity("");
    },
    onError: () => toast("error", "Failed to add activity"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!client) {
    return <div className="py-16 text-center text-sm text-zinc-500">Client not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{client.name}</h1>
            <p className="text-sm text-zinc-500">{client.email}</p>
          </div>
          <span className={cn(
            "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
            client.healthScore >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            client.healthScore >= 50 ? "bg-badge-warning-bg text-badge-warning-text" :
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            Score: {client.healthScore}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            setForm({ name: client.name, email: client.email, phone: client.phone || "", company: client.company || "", website: client.website || "", notes: client.notes || "" });
            setShowEdit(true);
          }}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDelete(true)} className="text-red-500">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-zinc-500">Email</p>
              <p className="font-medium text-zinc-900 dark:text-white">{client.email}</p>
            </div>
            <div>
              <p className="text-zinc-500">Phone</p>
              <p className="font-medium text-zinc-900 dark:text-white">{client.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Company</p>
              <p className="font-medium text-zinc-900 dark:text-white">{client.company || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Website</p>
              {client.website ? (
                <a href={client.website} target="_blank" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  {client.website} <ExternalLink className="inline h-3 w-3" />
                </a>
              ) : <p className="font-medium text-zinc-900 dark:text-white">N/A</p>}
            </div>
            <div>
              <p className="text-zinc-500">Client Since</p>
              <p className="font-medium text-zinc-900 dark:text-white">{new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {client.notes && (
            <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <p className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{client.notes}</p>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <a href={`mailto:${client.email}`} className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"><Mail className="h-4 w-4" /> Email</a>
            {client.phone && (
              <a href={`tel:${client.phone}`} className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"><Phone className="h-4 w-4" /> Call</a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deals ({client.deals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {client.deals.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No deals.</div>
            ) : (
              <div className="space-y-2">
                {client.deals.map((deal) => (
                  <a
                    key={deal.id}
                    href={`/dashboard/crm/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{deal.name}</p>
                      <p className="text-xs text-zinc-500">{deal.stage.replace(/_/g, " ")} - {deal.probability}%</p>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">${deal.value.toLocaleString()}</p>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects ({client.projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {client.projects.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No projects.</div>
            ) : (
              <div className="space-y-2">
                {client.projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{project.name}</p>
                      <p className="text-xs text-zinc-500">{project.startDate} - {project.endDate || "Ongoing"}</p>
                    </div>
                    <Badge variant={project.status === "ACTIVE" ? "default" : "outline"}>
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contracts ({client.contracts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {client.contracts.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No contracts.</div>
            ) : (
              <div className="space-y-2">
                {client.contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{contract.name}</p>
                      <p className="text-xs text-zinc-500">{new Date(contract.startDate).toLocaleDateString()} - {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "Open"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">${contract.value.toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">{contract.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices ({client.invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {client.invoices.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No invoices.</div>
            ) : (
              <div className="space-y-2">
                {client.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{invoice.number}</p>
                      <p className="text-xs text-zinc-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">${invoice.amount.toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">{invoice.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Add a note..."
              className="flex-1"
            />
            <Button size="sm" onClick={() => { if (newActivity.trim()) activityMutation.mutate(newActivity); }} disabled={!newActivity.trim()}>
              Add
            </Button>
          </div>
          {client.activities.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-500">No activity yet.</div>
          ) : (
            <div className="space-y-3">
              {client.activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
                  <Badge variant="outline" className="text-xs">{a.type}</Badge>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-700 dark:text-muted-foreground">{a.description}</p>
                    <p className="text-xs text-zinc-500">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Edit Client</h3>
              <button onClick={() => setShowEdit(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Email</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
                <Button variant="outline" type="button" onClick={() => setShowEdit(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Client</h3>
            <p className="mt-2 text-sm text-zinc-500">This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
