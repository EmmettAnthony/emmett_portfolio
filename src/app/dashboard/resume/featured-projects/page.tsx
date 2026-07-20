"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  FolderOpen
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface PortfolioProject {
  id: string;
  title: string;
  slug: string;
  category: { id: string; name: string } | null;
  featuredImage: string | null;
}

interface FeaturedProject {
  id: string;
  projectId: string;
  order: number;
  project: PortfolioProject;
}

interface PortfolioResponse {
  projects: PortfolioProject[];
  total: number;
}

export default function FeaturedProjectsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: featuredData, isLoading, error } = useQuery<{ featuredProjects: FeaturedProject[] }>({
    queryKey: ["dashboard-resume-featured-projects"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/featured-projects");
      if (!res.ok) throw new Error("Failed to fetch featured projects");
      return res.json();
    },
  });

  const { data: portfolioData, isLoading: portfolioLoading } = useQuery<PortfolioResponse>({
    queryKey: ["dashboard-portfolio-for-featured", searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: "100" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/dashboard/portfolio?${params}`);
      if (!res.ok) throw new Error("Failed to fetch portfolio projects");
      return res.json();
    },
    enabled: showSearch,
  });

  const featuredProjects = featuredData?.featuredProjects ?? [];
  const featuredProjectIds = new Set(featuredProjects.map((fp) => fp.projectId));
  const availableProjects = (portfolioData?.projects ?? []).filter(
    (p) => !featuredProjectIds.has(p.id)
  );

  const addMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch("/api/dashboard/resume/featured-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error("Failed to add featured project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-featured-projects"] });
      toast("success", "Project added to featured");
      setShowSearch(false);
      setSearchTerm("");
    },
    onError: () => toast("error", "Failed to add project"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/featured-projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove featured project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-featured-projects"] });
      toast("success", "Project removed from featured");
    },
    onError: () => toast("error", "Failed to remove project"),
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= featuredProjects.length) return;
    const items = [...featuredProjects];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    // The API uses order field; update via PUT on each
    Promise.all(
      items.map((item, i) =>
        fetch(`/api/dashboard/resume/featured-projects/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: i }),
        })
      )
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-featured-projects"] });
    }).catch(() => toast("error", "Failed to reorder"));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Bookmark className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load featured projects</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Featured Projects</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {featuredProjects.length} featured project{featuredProjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowSearch(true)}>
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {featuredProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Bookmark className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No featured projects</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Feature portfolio projects to showcase on your resume.
          </p>
          <Button className="mt-6" onClick={() => setShowSearch(true)}>
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((fp, index) => (
            <Card key={fp.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-badge-info-bg text-badge-info-text">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{fp.project.title}</h3>
                      {fp.project.category && (
                        <Badge variant="secondary" className="text-xs mt-0.5">{fp.project.category.name}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                      className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveItem(index, "down")}
                      disabled={index === featuredProjects.length - 1}
                      className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeMutation.mutate(fp.id)}
                      className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {fp.project.featuredImage && (
                  <div className="relative mt-3 h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <Image
                      src={fp.project.featuredImage}
                      alt={fp.project.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Project Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Featured Project</h2>
              <button
                onClick={() => { setShowSearch(false); setSearchTerm(""); }}
                className="rounded-md p-1.5 text-zinc-400 hover:text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {portfolioLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : availableProjects.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                {searchTerm ? "No projects found matching your search." : "All portfolio projects are already featured."}
              </p>
            ) : (
              <div className="space-y-2">
                {availableProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => addMutation.mutate(project.id)}
                    disabled={addMutation.isPending}
                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 p-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{project.title}</p>
                      {project.category && (
                        <p className="text-xs text-zinc-500">{project.category.name}</p>
                      )}
                    </div>
                    <Plus className="h-4 w-4 shrink-0 text-zinc-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
