"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Star,
  Loader2,
  Copy,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Layers,
  BarChart3,
  MessageSquare,
  TrendingUp,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton, StatsCardSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import type { Service, ServiceCategory } from "@/types/services";

interface ServicesResponse {
  services: Service[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    total: number;
    published: number;
    draft: number;
    totalInquiries: number;
    conversionRate: number;
  };
}

interface CategoriesResponse {
  categories: ServiceCategory[];
}

export default function ServicesPage() {

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<string | null>(null);
  const dragItem = useRef<{ id: string; order: number } | null>(null);

  const { data, isLoading, error } = useQuery<ServicesResponse>({
    queryKey: ["dashboard-services", page, search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "50", search, ...(categoryFilter !== "all" && { categoryId: categoryFilter }) });
      const res = await fetch(`/api/dashboard/services?${params}`);
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ["dashboard-service-categories"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/services/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete service");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-services"] });
      toast("success", "Service deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete service"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/services/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-services"] });
      toast("success", "Service duplicated");
    },
    onError: () => toast("error", "Failed to duplicate service"),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: string; ids: string[] }) => {
      const res = await fetch("/api/dashboard/services/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      if (!res.ok) throw new Error("Failed to perform bulk action");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-services"] });
      toast("success", `${data.count} services ${data.action === "delete" ? "deleted" : "updated"}`);
      setSelectedIds(new Set());
      setBulkConfirm(null);
    },
    onError: () => toast("error", "Failed to perform bulk action"),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, order }: { id: string; order: number }) => {
      const res = await fetch(`/api/dashboard/services/${id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-services"] }),
    onError: () => toast("error", "Failed to reorder"),
  });

  const allSelected = data?.services.length && data.services.every((s) => selectedIds.has(s.id));
  const toggleAll = () => {
    if (allSelected) { setSelectedIds(new Set()); return; }
    setSelectedIds(new Set(data?.services.map((s) => s.id) ?? []));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleDragStart = (id: string, order: number) => {
    dragItem.current = { id, order };
  };
  const handleDragOver = useCallback((e: React.DragEvent, _targetId: string) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.5";
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
  }, []);
  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.opacity = "1";
    if (!dragItem.current || dragItem.current.id === targetId) return;
    reorderMutation.mutate({ id: dragItem.current.id, order: Date.now() }); // eslint-disable-line react-hooks/purity
  }, [reorderMutation]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Layers className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load services</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const stats = data?.stats ?? { total: 0, published: 0, draft: 0, totalInquiries: 0, conversionRate: 0 };
  const categories = categoriesData?.categories ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Services</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data?.total ?? 0} total services</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/services/categories")} className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">
            <Layers className="h-4 w-4" /> Categories
          </button>
          <button onClick={() => router.push("/dashboard/services/analytics")} className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">
            <BarChart3 className="h-4 w-4" /> Analytics
          </button>
          <button onClick={() => router.push("/dashboard/services/create")} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600">
            <Plus className="h-4 w-4" /> Create Service
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <StatsCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Services", value: stats.total, icon: Layers, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
            { label: "Published", value: stats.published, icon: Star, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
            { label: "Inquiries", value: stats.totalInquiries, icon: MessageSquare, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400" },
            { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                  <div className={cn("rounded-xl p-2", stat.color.split(" ").slice(1).join(" "))}>
                    <Icon className={cn("h-4 w-4", stat.color.split(" ")[0])} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search services..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); setSelectedIds(new Set()); }} className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); setSelectedIds(new Set()); }} className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
          <option value="all">All Categories</option>
          {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-blue-200 dark:bg-blue-700" />
          <button onClick={() => bulkMutation.mutate({ action: "publish", ids: Array.from(selectedIds) })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">Publish</button>
          <button onClick={() => bulkMutation.mutate({ action: "unpublish", ids: Array.from(selectedIds) })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">Unpublish</button>
          <button onClick={() => bulkMutation.mutate({ action: "feature", ids: Array.from(selectedIds) })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">Feature</button>
          <button onClick={() => bulkMutation.mutate({ action: "unfeature", ids: Array.from(selectedIds) })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800">Unfeature</button>
          <div className="h-4 w-px bg-blue-200 dark:bg-blue-700" />
          <button onClick={() => setBulkConfirm("delete")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30">Delete</button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-700">Clear</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="w-10 px-2 py-3 text-left">
                      <input type="checkbox" checked={!!allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700" />
                    </th>
                    <th className="w-8 px-1 py-3" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Featured</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Views</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data?.services.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-16">
                        <EmptyState icon={Layers} title="No services found" description={search || categoryFilter !== "all" ? "Try adjusting your search or filters." : "Get started by creating your first service."} action={!search && categoryFilter === "all" ? { label: "Create Service", onClick: () => router.push("/dashboard/services/create") } : undefined} />
                      </td>
                    </tr>
                  ) : (
                    data?.services.map((service) => (
                      <tr
                        key={service.id}
                        draggable
                        onDragStart={() => handleDragStart(service.id, service.order)}
                        onDragOver={(e) => handleDragOver(e, service.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, service.id)}
                        className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        onClick={() => router.push(`/dashboard/services/${service.id}`)}
                      >
                        <td className="w-10 px-2 py-4" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(service.id)} onChange={() => toggleOne(service.id)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700" />
                        </td>
                        <td className="w-8 px-1 py-4 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                          <GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" />
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {service.icon && <span className="text-lg">{service.icon}</span>}
                            {service.title}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground dark:text-zinc-400">{service.category?.name ?? "—"}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground dark:text-zinc-400">{service.startingPrice != null ? `$${service.startingPrice.toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", service.published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground")}>{service.published ? "Published" : "Draft"}</span>
                        </td>
                        <td className="px-4 py-4">{service.featured ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <Star className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground dark:text-zinc-400">{service.viewCount.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => router.push(`/dashboard/services/${service.id}`)} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"><Edit3 className="h-4 w-4" /></button>
                            <button onClick={() => duplicateMutation.mutate(service.id)} disabled={duplicateMutation.isPending} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-blue-500 dark:hover:bg-zinc-800"><Copy className="h-4 w-4" /></button>
                            <button onClick={() => setDeleteId(service.id)} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
                <p className="text-sm text-zinc-500">Page {data.page} of {data.totalPages}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Service</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete this service? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {bulkConfirm === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete {selectedIds.size} Services</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete {selectedIds.size} services? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setBulkConfirm(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={() => bulkMutation.mutate({ action: "delete", ids: Array.from(selectedIds) })} disabled={bulkMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
                {bulkMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
