"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const TEMPLATES = [
  { id: "modern", label: "Modern" },
  { id: "corporate", label: "Corporate" },
  { id: "minimalist", label: "Minimalist" },
  { id: "developer", label: "Developer" },
  { id: "executive", label: "Executive" },
];

export default function ResumePreviewPage() {

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["resume-profile"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/profile");
      if (!res.ok) throw new Error("Failed to fetch resume profile");
      return res.json();
    },
  });

  const resume = profile?.resume;
  const currentTemplate = selectedTemplate || resume?.template || "modern";

  const saveMutation = useMutation({
    mutationFn: async (template: string) => {
      const res = await fetch("/api/dashboard/resume/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...resume, template }),
      });
      if (!res.ok) throw new Error("Failed to save template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-profile"] });
      toast("success", "Template saved successfully");
    },
    onError: () => {
      toast("error", "Failed to save template");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/resume"
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Resume Preview</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {resume?.published ? "Published" : "Draft"} &mdash; {currentTemplate} template
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.open("/resume", "_blank")}>
            <ExternalLink className="h-4 w-4" />
            Open Live
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TEMPLATES.map((t) => (
          <Button
            key={t.id}
            variant={currentTemplate === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTemplate(t.id)}
          >
            {t.label}
          </Button>
        ))}
        {selectedTemplate && selectedTemplate !== resume?.template && (
          <Button
            size="sm"
            className="ml-2 gap-1.5"
            onClick={() => saveMutation.mutate(selectedTemplate)}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4" />
            Save Template
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-8">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : resume ? (
            <iframe
              src={`/resume?template=${currentTemplate}`}
              className="h-[calc(100vh-16rem)] w-full rounded-lg"
              title="Resume Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <p className="text-lg font-medium">No resume profile yet</p>
              <p className="mt-1 text-sm">Create a profile to see a preview.</p>
              <Link href="/dashboard/resume/profile">
                <Button className="mt-4">Create Profile</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
