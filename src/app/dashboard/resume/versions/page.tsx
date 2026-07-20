"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { History, RotateCcw, Plus, Loader2, FileText } from "lucide-react";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface ResumeVersion {
  id: string;
  label: string;
  createdAt: string;
}

interface VersionsResponse {
  versions: ResumeVersion[];
}

export default function VersionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saveOpen, setSaveOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<VersionsResponse>({
    queryKey: ["resume-versions"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/versions");
      if (res.status === 404) return { versions: [] };
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (label: string) => {
      const res = await fetch("/api/dashboard/resume/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error("Failed to save version");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-versions"] });
      setSaveOpen(false);
      setLabel("");
      toast("success", "Version saved");
    },
    onError: () => toast("error", "Failed to save version"),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/versions/${id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restore version");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-versions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-profile"] });
      setRestoreId(null);
      toast("success", "Resume restored to version");
    },
    onError: () => toast("error", "Failed to restore version"),
  });

  const versions = data?.versions ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <History className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load versions</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Version History</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Save and restore previous versions of your resume
          </p>
        </div>
        <Button onClick={() => setSaveOpen(true)}>
          <Plus className="h-4 w-4" />
          Save Current Version
        </Button>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <History className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No versions saved yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Save a version of your resume to keep a snapshot you can restore later.
          </p>
          <Button className="mt-6" onClick={() => setSaveOpen(true)}>
            <Plus className="h-4 w-4" />
            Save Current Version
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <Card key={version.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {version.label || "Untitled Version"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(new Date(version.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(version.createdAt), "MMM d, yyyy")}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRestoreId(version.id)}
                    disabled={restoreMutation.isPending && restoreId === version.id}
                  >
                    {restoreMutation.isPending && restoreId === version.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Restore
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Save Version Dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Version</DialogTitle>
            <DialogDescription>
              Give this version a label to remember what changed.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g., Before layout redesign, Portfolio v2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saveMutation.isPending) {
                saveMutation.mutate(label);
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaveOpen(false); setLabel(""); }}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate(label)} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!restoreId} onOpenChange={(open) => { if (!open) setRestoreId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
            <DialogDescription>
              This will replace your current resume with this saved version. This action can be undone by restoring another version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreId(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => restoreId && restoreMutation.mutate(restoreId)}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
