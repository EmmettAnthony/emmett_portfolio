"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Key, Copy, Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPerms, setNewPerms] = useState("read");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const { data: keys, isLoading } = useQuery<ApiKeyData[]>({
    queryKey: ["newsletter-api-keys"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/api-keys");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; permissions: string }) => {
      const res = await fetch("/api/newsletter/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-api-keys"] });
      setCreatedKey(result.rawKey);
      setNewName("");
      toast("success", "API key created — copy it now, it won't be shown again");
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/api-keys?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-api-keys"] });
      toast("success", "API key revoked");
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const permBadge = (p: string) => {
    const colors: Record<string, string> = {
      read: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      write: "bg-badge-warning-bg text-badge-warning-text",
      admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[p] || colors.read)}>{p}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage keys for external integrations with the newsletter API
          </p>
        </div>
        <button onClick={() => { setShowCreate(true); setCreatedKey(null); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600">
          <Plus className="h-4 w-4" /> Create Key
        </button>
      </div>

      {createdKey && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">Save this key — it will not be shown again!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-mono dark:bg-zinc-800">
              {showKey ? createdKey : `${createdKey.slice(0, 12)}${"•".repeat(Math.min(createdKey.length - 12, 20))}`}
            </code>
            <button onClick={() => setShowKey(!showKey)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(createdKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : !keys || keys.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No API keys yet"
          description="Create a key to use the newsletter API programmatically"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Last Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {keys.map((key) => (
                <tr key={key.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">{key.name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-zinc-500">{key.keyPrefix}...</td>
                  <td className="px-6 py-4">{permBadge(key.permissions)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { if (confirm("Revoke this key?")) deleteMutation.mutate(key.id); }} className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && !createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Create API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Key Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder="e.g., Zapier Integration" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Permissions</label>
                <select value={newPerms} onChange={(e) => setNewPerms(e.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  <option value="read">Read Only</option>
                  <option value="write">Read + Write</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={() => createMutation.mutate({ name: newName, permissions: newPerms })} disabled={!newName.trim() || createMutation.isPending} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
