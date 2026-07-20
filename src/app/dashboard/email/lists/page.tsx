"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  List,
  Plus,
  Trash2,
  Loader2,
  Users,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isPublic: boolean;
  color: string | null;
  source: string | null;
  createdAt: string;
  _count: { members: number };
}

export default function ContactListsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const { data: lists, isLoading } = useQuery<ContactList[]>({
    queryKey: ["contact-lists"],
    queryFn: async () => {
      const res = await fetch("/api/email/contact-lists");
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch("/api/email/contact-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create list");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast("success", "List created");
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email/contact-lists?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete list");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast("success", "List deleted");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Contact Lists</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Organize your contacts into lists for targeted campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New List
        </Button>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Contact List</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Newsletter Subscribers"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description (optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this list for?"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={() => newName.trim() && createMutation.mutate({ name: newName, description: newDescription })} disabled={!newName.trim() || createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5">
              <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
              <div className="h-4 w-16 rounded bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            </CardContent></Card>
          ))}
        </div>
      ) : lists && lists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="group transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: list.color || "#3b82f6" + "20" }}
                    >
                      <List className="h-4 w-4" style={{ color: list.color || "#3b82f6" }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{list.name}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <Users className="h-3 w-3" />
                          {list._count.members} members
                        </span>
                        {list.isDefault && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            Default
                          </span>
                        )}
                        {!list.isPublic ? (
                          <Lock className="h-3 w-3 text-zinc-400" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(list.id)}
                    className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {list.description && (
                  <p className="mt-3 text-xs text-zinc-500 line-clamp-2">{list.description}</p>
                )}
                {list.source && (
                  <p className="mt-2 text-[10px] text-zinc-400 capitalize">Source: {list.source}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <List className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium text-zinc-500">No lists yet</p>
          <p className="mt-1 text-sm">Create your first contact list to organize subscribers.</p>
        </div>
      )}
    </div>
  );
}
