"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Sparkles,
  Download,
  Layout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TEMPLATE_CATEGORIES, PREBUILT_TEMPLATES } from "@/lib/email/templates/prebuilt";
import type { EmailTemplate } from "@/types/email";

const ALL_CATEGORIES = [
  { value: "all", label: "All", color: "", icon: "" },
  ...TEMPLATE_CATEGORIES,
];

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/email/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email/templates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast("success", "Template deleted");
      setDeleteId(null);
    },
    onError: (err) => toast("error", `Failed to delete: ${err.message}`),
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email/templates/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed templates");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast("success", `Seeded ${result.created} templates (${result.updated} updated)`);
      setShowSeedConfirm(false);
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const categoryCounts: Record<string, number> = {};
  templates?.forEach((t) => {
    const cat = t.category?.toLowerCase() || "custom";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const filtered = templates?.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || (t.category?.toLowerCase() || "custom") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const hasBuiltInTemplates = templates?.some((t) => t.isBuiltIn);
  const builtInCount = PREBUILT_TEMPLATES.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Email Templates</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {templates?.length ?? 0} templates &middot; Create and manage reusable email templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!hasBuiltInTemplates && (
            <Button
              variant="outline"
              onClick={() => setShowSeedConfirm(true)}
              disabled={seedMutation.isPending}
              className="gap-1.5"
            >
              {seedMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Install Pre-built
            </Button>
          )}
          {hasBuiltInTemplates && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSeedConfirm(true)}
              disabled={seedMutation.isPending}
              className="gap-1.5 text-xs text-zinc-400"
            >
              <Download className="h-3.5 w-3.5" />
              Re-seed
            </Button>
          )}
          <Button onClick={() => router.push("/dashboard/email/templates/new")}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Category + Search Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = categoryFilter === cat.value;
            const count = cat.value === "all" ? templates?.length : categoryCounts[cat.value] || 0;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-all",
                  isActive
                    ? cat.value === "all"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-brand-500 text-white shadow-sm"
                    : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                )}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.label}
                {(count ?? 0) > 0 && (
                  <span className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                    isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  )}>
                    {count ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-3" />
                <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/50 animate-pulse mb-2" />
                <div className="h-3 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => {
            const catInfo = TEMPLATE_CATEGORIES.find(
              (c) => c.value === (template.category?.toLowerCase() || "custom")
            );
            return (
              <Card
                key={template.id}
                className="group cursor-pointer transition-all hover:shadow-md"
                onClick={() => router.push(`/dashboard/email/templates/${template.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "rounded-lg p-2 shrink-0",
                        catInfo?.color?.split(" ")[0] || "bg-zinc-100 dark:bg-zinc-800"
                      )}>
                        <FileText className={cn(
                          "h-4 w-4",
                          catInfo?.color?.split(" ")[1] || "text-zinc-600 dark:text-zinc-400"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                            {template.name}
                          </h3>
                          {template.isBuiltIn && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 px-1.5 py-0.5 text-[9px] font-medium text-white shrink-0">
                              <Sparkles className="h-2.5 w-2.5" />
                              Built-in
                            </span>
                          )}
                        </div>
                        {template.category && (
                          <span className={cn(
                            "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                            catInfo?.color || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          )}>
                            {catInfo?.label || template.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/email/templates/${template.id}`);
                        }}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      {!template.isBuiltIn && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(template.id);
                          }}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {template.description && (
                    <p className="mt-3 text-xs text-zinc-500 line-clamp-2">{template.description}</p>
                  )}
                  <p className="mt-3 text-[10px] text-zinc-400">
                    Updated {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Layout className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium text-zinc-500">
            {search || categoryFilter !== "all" ? "No matching templates" : "No templates yet"}
          </p>
          <p className="mt-1 text-sm">
            {search || categoryFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first email template or install the pre-built collection."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => router.push("/dashboard/email/templates/new")}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Template
            </Button>
            {!hasBuiltInTemplates && (
              <Button variant="outline" onClick={() => setShowSeedConfirm(true)} className="gap-1.5">
                <Download className="h-4 w-4" />
                Install Pre-built ({builtInCount} templates)
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Seed Confirmation Dialog */}
      <Dialog open={showSeedConfirm} onOpenChange={() => setShowSeedConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-500" />
              Install Pre-built Templates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 p-4 dark:from-brand-900/20 dark:to-purple-900/20">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                This will install <strong>{builtInCount} professionally designed email templates</strong> covering:
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {TEMPLATE_CATEGORIES.filter((c) => c.value !== "custom").map((cat) => (
                  <div key={cat.value} className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Built-in templates can be used as starting points for your campaigns. They are editable and
              distinguishable by the &quot;Built-in&quot; badge. Existing built-in templates will be updated.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowSeedConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="gap-2"
            >
              {seedMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {seedMutation.isPending ? "Installing..." : `Install ${builtInCount} Templates`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Template</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-500">Are you sure? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
