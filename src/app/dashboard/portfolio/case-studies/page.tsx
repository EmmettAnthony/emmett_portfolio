"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import Link from "next/link"
import { Edit3, Trash2, Loader2, FileText, Search } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent
} from "@/components/ui/card"

interface CaseStudyItem {
  id: string;
  projectId: string;
  project: { id: string; title: string; slug: string };
  projectGoals: string | null;
  businessProblem: string | null;
  results: string | null;
  createdAt: string;
}

function excerpt(text: string | null, max = 100) {
  if (!text) return null;
  return text.length > max ? text.slice(0, max) + "..." : text;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function PortfolioCaseStudiesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-portfolio-case-studies"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/portfolio/case-studies");
      if (!res.ok) throw new Error("Failed to fetch case studies");
      return res.json() as Promise<{ caseStudies: CaseStudyItem[] }>;
    },
  });

  const caseStudies = data?.caseStudies ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/portfolio/case-studies/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to delete"); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio-case-studies"] });
      toast("success", "Case study deleted");
      setDeleteId(null);
      setDeleteError("");
    },
    onError: (err: Error) => { setDeleteError(err.message); },
  });

  const filtered = caseStudies.filter(
    (cs) =>
      cs.project.title.toLowerCase().includes(search.toLowerCase()) ||
      (cs.projectGoals && cs.projectGoals.toLowerCase().includes(search.toLowerCase()))
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <FileText className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load case studies</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Case Studies</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{caseStudies.length} total case studies</p>
        </div>
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search case studies..."
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {caseStudies.length === 0
                ? "No case studies yet. Create your first one!"
                : "No case studies match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((cs) => (
            <Card key={cs.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-surface">
              <div className="flex items-start justify-between p-6">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/portfolio/case-studies/${cs.id}`}
                    className="text-base font-semibold text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {cs.project.title}
                  </Link>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Project Goals</p>
                      <p className="mt-0.5 text-sm text-muted-foreground dark:text-zinc-400">
                        {excerpt(cs.projectGoals) || <span className="italic text-muted-foreground dark:text-muted-foreground">Not provided</span>}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Business Problem</p>
                      <p className="mt-0.5 text-sm text-muted-foreground dark:text-zinc-400">
                        {excerpt(cs.businessProblem) || <span className="italic text-muted-foreground dark:text-muted-foreground">Not provided</span>}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Results</p>
                      <p className="mt-0.5 text-sm text-muted-foreground dark:text-zinc-400">
                        {excerpt(cs.results) || <span className="italic text-muted-foreground dark:text-muted-foreground">Not provided</span>}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">Created {formatDate(cs.createdAt)}</p>
                </div>
                <div className="ml-4 flex shrink-0 items-start gap-1">
                  <Link href={`/dashboard/portfolio/case-studies/${cs.id}`}>
                    <Button variant="ghost" size="icon">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => { setDeleteId(cs.id); setDeleteError(""); }} className="hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setDeleteId(null); setDeleteError(""); }}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Case Study</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this case study? This action cannot be undone.
            </p>
            {deleteError && <p className="mt-2 text-sm text-red-500">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteId(null); setDeleteError(""); }}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
