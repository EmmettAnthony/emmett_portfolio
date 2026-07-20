"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Search, Star, Eye, EyeOff, Edit3, Trash2, Copy, GripVertical,
  ChevronLeft, ChevronRight, Loader2, Download, X,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

interface PortfolioProject {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  clientName: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  technologies: { id: string; name: string; slug: string }[];
  featuredImage: string | null;
  status: string;
  featured: boolean;
  published: boolean;
  order: number;
  viewCount: number;
  createdAt: string;
}

interface PortfolioResponse {
  projects: PortfolioProject[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
};

export default function PortfolioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dragItem = useRef<{ id: string; order: number; index: number } | null>(null);

  const hasActiveFilters = search || categoryFilter !== "all" || statusFilter !== "ALL";

  const queryKey = ["dashboard-portfolio", search, categoryFilter, statusFilter, page];

  const { data, isLoading, error } = useQuery<PortfolioResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", "12");
      const res = await fetch(`/api/dashboard/portfolio?${params}`);
      if (!res.ok) throw new Error("Failed to fetch portfolio projects");
      return res.json();
    },
  });

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["dashboard-portfolio-categories"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/portfolio/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const updateURL = useCallback((params: { search?: string; categoryId?: string; status?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const s = params.search ?? search;
    const c = params.categoryId ?? categoryFilter;
    const st = params.status ?? statusFilter;
    const p = params.page ?? page;
    if (s) sp.set("search", s);
    if (c && c !== "all") sp.set("categoryId", c);
    if (st && st !== "ALL") sp.set("status", st);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    router.replace(`/dashboard/portfolio${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, categoryFilter, statusFilter, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSelectedIds(new Set());
      updateURL({ search: value, page: 1 });
    }, 300);
  };

  const handleCategoryChange = (value: string | null) => {
    const v = value ?? "all";
    setCategoryFilter(v);
    setPage(1);
    setSelectedIds(new Set());
    updateURL({ categoryId: v, page: 1 });
  };

  const handleStatusChange = (value: string | null) => {
    const v = value ?? "ALL";
    setStatusFilter(v);
    setPage(1);
    setSelectedIds(new Set());
    updateURL({ status: v, page: 1 });
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("ALL");
    setPage(1);
    setSelectedIds(new Set());
    router.replace("/dashboard/portfolio", { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set());
    updateURL({ page: newPage });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio"] });
      toast("success", "Project deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete project"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/dashboard/portfolio/duplicate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error("Failed to duplicate project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio"] });
      toast("success", "Project duplicated");
    },
    onError: () => toast("error", "Failed to duplicate project"),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
      const res = await fetch("/api/dashboard/portfolio/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      if (!res.ok) throw new Error("Failed to perform bulk action");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio"] });
      toast("success", `${data.count} projects ${data.action === "delete" ? "deleted" : "updated"}`);
      setSelectedIds(new Set());
      setBulkConfirm(null);
    },
    onError: () => toast("error", "Failed to perform bulk action"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; order: number }[]) => {
      const res = await fetch("/api/dashboard/portfolio/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio"] }),
    onError: () => toast("error", "Failed to reorder"),
  });

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleDragStart = (project: PortfolioProject, index: number) => {
    dragItem.current = { id: project.id, order: project.order, index };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetIndex: number) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.id === targetId || !data) return;

    const items = [...data.projects];
    const draggedIndex = dragItem.current.index;
    const [moved] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, moved);

    const reordered = items.map((item, i) => ({ id: item.id, order: i }));
    reorderMutation.mutate(reordered);
  };

  useEffect(() => {
    return () => clearTimeout(searchTimeout.current);
  }, []);

  const categories = categoriesData?.categories ?? [];
  const projects = data?.projects ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Portfolio</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data?.total ?? 0} total projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={async () => {
            try {
              const res = await fetch("/api/dashboard/portfolio/export");
              if (!res.ok) throw new Error("Export failed");
              const data = await res.json();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `portfolio-export-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast("success", `Exported ${data.count} projects`);
            } catch {
              toast("error", "Failed to export projects");
            }
          }}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/dashboard/portfolio/create">
            <Button>
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by title, description, client..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); setSelectedIds(new Set()); updateURL({ search: "", page: 1 }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-blue-200 dark:bg-blue-700" />
          <button onClick={() => bulkMutation.mutate({ action: "publish", ids: Array.from(selectedIds) })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">Publish</button>
          <button onClick={() => bulkMutation.mutate({ action: "unpublish", ids: Array.from(selectedIds) })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">Unpublish</button>
          <button onClick={() => bulkMutation.mutate({ action: "feature", ids: Array.from(selectedIds) })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">Feature</button>
          <button onClick={() => bulkMutation.mutate({ action: "archive", ids: Array.from(selectedIds) })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">Archive</button>
          <div className="h-4 w-px bg-blue-200 dark:bg-blue-700" />
          <button onClick={() => setBulkConfirm("delete")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30">Delete</button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-700">Clear</button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Layers className="mb-3 h-10 w-10 text-red-400" />
          <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load projects</p>
          <p className="mt-1 text-sm">Please try refreshing the page.</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty States */}
      {!isLoading && !error && projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          {data && data.total === 0 && !hasActiveFilters ? (
            <>
              <Layers className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No projects yet</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Get started by adding your first portfolio project.</p>
              <Link href="/dashboard/portfolio/create">
                <Button className="mt-6">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Search className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No results found</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Try adjusting your search or filters to find what you&apos;re looking for.</p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-6">
                Clear Filters
              </Button>
            </>
          )}
        </div>
      )}

      {/* Project Grid */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              draggable
              onDragStart={() => handleDragStart(project, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, project.id, index)}
              className={cn(
                "overflow-hidden transition-all",
                selectedIds.has(project.id) && "ring-2 ring-blue-500",
              )}
            >
              {/* Featured Image or Placeholder */}
              <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="absolute left-2 top-2 z-10 cursor-grab active:cursor-grabbing rounded-md p-1 text-zinc-400 hover:bg-zinc-200/70 hover:text-muted-foreground dark:hover:bg-zinc-700/70 dark:hover:text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-4 w-4" />
                </div>

                <div className="absolute left-2 top-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(project.id)}
                    onChange={() => toggleOne(project.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="ml-7 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
                  />
                </div>

                {project.featuredImage ? (
                  <Image
                    src={project.featuredImage}
                    alt={project.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-3xl font-bold text-muted-foreground dark:text-muted-foreground">
                      {project.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Overlay badges */}
                <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                  {project.featured && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                      project.published
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    )}
                  >
                    {project.published ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </span>
                </div>

                {/* Status badge */}
                <div className="absolute bottom-2 left-2 z-10">
                  <span className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                    STATUS_STYLES[project.status] || STATUS_STYLES.DRAFT
                  )}>
                    {project.status}
                  </span>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-1">
                    {project.title}
                  </h3>
                </div>

                {/* Category */}
                {project.category && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {project.category.name}
                  </p>
                )}

                {/* Short Description */}
                {project.shortDescription && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 dark:text-zinc-400">
                    {project.shortDescription}
                  </p>
                )}

                {/* Technology Tags */}
                {project.technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech.id}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {tech.name}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                        +{project.technologies.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Client + View Count + Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {project.clientName && (
                      <span>{project.clientName}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {project.viewCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/dashboard/portfolio/${project.id}`)}
                      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/portfolio/${project.slug}?preview=true`}
                      target="_blank"
                      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-blue-500 dark:hover:bg-zinc-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => duplicateMutation.mutate(project.id)}
                      disabled={duplicateMutation.isPending}
                      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-blue-500 dark:hover:bg-zinc-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(project.id)}
                      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  const total = data.totalPages;
                  const current = data.page;
                  if (total <= 7) return true;
                  if (p === 1 || p === total) return true;
                  if (Math.abs(p - current) <= 1) return true;
                  return false;
                })
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-zinc-400">...</span>}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                          p === data.page
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Project</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this project? This action cannot be undone.
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

      {/* Bulk Delete Confirmation */}
      {bulkConfirm === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete {selectedIds.size} Projects</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete {selectedIds.size} projects? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setBulkConfirm(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => bulkMutation.mutate({ action: "delete", ids: Array.from(selectedIds) })}
                disabled={bulkMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {bulkMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
