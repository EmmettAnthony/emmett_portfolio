"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";import type { CaseStudyForm } from "@/lib/validations/portfolio";
import { caseStudySchema } from "@/lib/validations/portfolio";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CaseStudyItem {
  id: string;
  projectId: string;
  project: { id: string; title: string; slug: string };
  clientBackground: string | null;
  businessProblem: string | null;
  objectives: string | null;
  research: string | null;
  solution: string | null;
  developmentProcess: string | null;
  results: string | null;
  lessonsLearned: string | null;
  challenges: string | null;
  requirements: string | null;
  projectGoals: string | null;
  problemStatement: string | null;
}

export default function EditCaseStudyPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-portfolio-case-studies"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/portfolio/case-studies");
      if (!res.ok) throw new Error("Failed to fetch case studies");
      return res.json() as Promise<{ caseStudies: CaseStudyItem[] }>;
    },
  });

  const caseStudy = data?.caseStudies.find((cs) => cs.id === params.id) ?? null;

  const form = useForm<CaseStudyForm>({
    resolver: zodResolver(caseStudySchema),
    defaultValues: {
      clientBackground: "",
      businessProblem: "",
      objectives: "",
      research: "",
      solution: "",
      developmentProcess: "",
      results: "",
      lessonsLearned: "",
      challenges: "",
      requirements: "",
      projectGoals: "",
      problemStatement: "",
    },
  });

  useEffect(() => {
    if (caseStudy) {
      form.reset({
        clientBackground: caseStudy.clientBackground ?? "",
        businessProblem: caseStudy.businessProblem ?? "",
        objectives: caseStudy.objectives ?? "",
        research: caseStudy.research ?? "",
        solution: caseStudy.solution ?? "",
        developmentProcess: caseStudy.developmentProcess ?? "",
        results: caseStudy.results ?? "",
        lessonsLearned: caseStudy.lessonsLearned ?? "",
        challenges: caseStudy.challenges ?? "",
        requirements: caseStudy.requirements ?? "",
        projectGoals: caseStudy.projectGoals ?? "",
        problemStatement: caseStudy.problemStatement ?? "",
      });
    }
  }, [caseStudy, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: CaseStudyForm) => {
      const res = await fetch(`/api/dashboard/portfolio/case-studies/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update case study");
      }
    },
    onSuccess: () => {
      toast("success", "Case study updated");
      router.push("/dashboard/portfolio/case-studies");
    },
    onError: (err: Error) => {
      toast("error", err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/portfolio/case-studies/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete case study");
      }
    },
    onSuccess: () => {
      toast("success", "Case study deleted");
      router.push("/dashboard/portfolio/case-studies");
    },
    onError: (err: Error) => {
      toast("error", err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !caseStudy) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <p className="text-lg font-medium text-red-600 dark:text-red-400">
          {error ? "Failed to load case study" : "Case study not found"}
        </p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  function onSubmit(values: CaseStudyForm) {
    updateMutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/portfolio/case-studies")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Edit Case Study - {caseStudy.project.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Problem & Challenge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="problemStatement">Problem Statement</Label>
                  <Textarea
                    id="problemStatement"
                    rows={6}
                    {...form.register("problemStatement")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessProblem">Business Problem</Label>
                  <Textarea
                    id="businessProblem"
                    rows={6}
                    {...form.register("businessProblem")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Process & Solution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objectives</Label>
                  <Textarea
                    id="objectives"
                    rows={6}
                    {...form.register("objectives")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="research">Research</Label>
                  <Textarea
                    id="research"
                    rows={6}
                    {...form.register("research")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="solution">Solution</Label>
                  <Textarea
                    id="solution"
                    rows={8}
                    {...form.register("solution")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="developmentProcess">Development Process</Label>
                  <Textarea
                    id="developmentProcess"
                    rows={8}
                    {...form.register("developmentProcess")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results & Learning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="results">Results</Label>
                  <Textarea
                    id="results"
                    rows={8}
                    {...form.register("results")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Problem & Challenge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="challenges">Challenges</Label>
                  <Textarea
                    id="challenges"
                    rows={6}
                    {...form.register("challenges")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    rows={6}
                    {...form.register("requirements")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results & Learning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectGoals">Project Goals</Label>
                  <Textarea
                    id="projectGoals"
                    rows={5}
                    {...form.register("projectGoals")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessonsLearned">Lessons Learned</Label>
                  <Textarea
                    id="lessonsLearned"
                    rows={5}
                    {...form.register("lessonsLearned")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientBackground">Client Background</Label>
                  <Textarea
                    id="clientBackground"
                    rows={5}
                    {...form.register("clientBackground")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Delete Case Study
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this case study? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
