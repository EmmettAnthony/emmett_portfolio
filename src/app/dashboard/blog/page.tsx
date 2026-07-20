"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Loader2,
  EyeOff,
  Eye,
  Trash2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function BlogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const res = await fetch("/api/blog");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setDeleteId(null);
    },
  });

  const posts = data?.posts ?? [];
  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.category?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <Link
          href="/dashboard/blog/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          {/* Posts table */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/blog/${post.id}/edit`}
                        className="font-medium text-zinc-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-400"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {post.category && (
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                          {post.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                          post.published
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-badge-warning-bg text-badge-warning-text"
                        )}
                      >
                        {post.published ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                      {post.publishedAt ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">
                          Created {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteId(post.id)}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-500">
              {search ? "No posts match your search." : "No blog posts yet. Create your first post!"}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete post?</h3>
            <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
