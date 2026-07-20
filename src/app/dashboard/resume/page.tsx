"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {Briefcase, GraduationCap, Wrench, Award, FileText, Download, Eye, Plus, ArrowUpRight, User, Globe, Loader2, Bookmark, Languages, Users, Star, Search, History} from "lucide-react";




















import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useToast } from "@/components/ui/toast";

interface ResumeProfile {
  id: string;
  fullName: string;
  professionalTitle: string;
  photo: string | null;
  template: string;
  published: boolean;
  experiences: { id: string }[];
  education: { id: string }[];
  skills: { id: string }[];
  certifications: { id: string }[];
  awards: { id: string }[];
  languages: { id: string }[];
  references: { id: string }[];
  downloads: { id: string }[];
}

interface ResumeData {
  resume: ResumeProfile;
}

interface DownloadStats {
  total: number;
  byTemplate: { template: string; count: number }[];
  trend: { date: string; count: number }[];
}

const QUICK_ACTIONS = [
  { label: "Profile", href: "/dashboard/resume/profile", icon: User },
  { label: "Experience", href: "/dashboard/resume/experience", icon: Briefcase },
  { label: "Education", href: "/dashboard/resume/education", icon: GraduationCap },
  { label: "Skills", href: "/dashboard/resume/skills", icon: Wrench },
  { label: "Certifications", href: "/dashboard/resume/certifications", icon: Award },
  { label: "Awards", href: "/dashboard/resume/awards", icon: Star },
  { label: "Languages", href: "/dashboard/resume/languages", icon: Languages },
  { label: "References", href: "/dashboard/resume/references", icon: Users },
  { label: "Featured Projects", href: "/dashboard/resume/featured-projects", icon: Bookmark },
  { label: "Downloads", href: "/dashboard/resume/downloads", icon: Download },
  { label: "ATS Score", href: "/dashboard/resume/ats", icon: Search },
  { label: "Version History", href: "/dashboard/resume/versions", icon: History },
];

const TEMPLATES: Record<string, string> = {
  modern: "Modern",
  corporate: "Corporate",
  minimalist: "Minimalist",
  developer: "Developer",
  executive: "Executive",
};

export default function ResumeDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profileData, isLoading, error } = useQuery<ResumeData>({
    queryKey: ["dashboard-resume-profile"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/profile");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch resume profile");
      return res.json();
    },
  });

  const { data: downloadStats } = useQuery<DownloadStats>({
    queryKey: ["dashboard-resume-downloads"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/downloads");
      if (!res.ok) throw new Error("Failed to fetch download stats");
      return res.json();
    },
    enabled: !!profileData?.resume,
  });

  const { data: sectionViews } = useQuery({
    queryKey: ["dashboard-resume-section-views"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/section-views");
      if (!res.ok) throw new Error("Failed to fetch section views");
      return res.json() as Promise<{
        sections: { section: string; total: number }[];
        totalViews: number;
      }>;
    },
    enabled: !!profileData?.resume,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/dashboard/resume/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileData?.resume?.fullName,
          professionalTitle: profileData?.resume?.professionalTitle,
          published: !profileData?.resume?.published,
        }),
      });
      if (!res.ok) throw new Error("Failed to update publish status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-profile"] });
      toast("success", profileData?.resume?.published ? "Resume unpublished" : "Resume published");
    },
    onError: () => toast("error", "Failed to update publish status"),
  });

  const [saveLabel, setSaveLabel] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  const { data: atsResult } = useQuery({
    queryKey: ["resume-ats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/ats");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to check ATS score");
      return res.json() as Promise<{
        overall: number;
        sections: { name: string; score: number; maxScore: number; tips: string[] }[];
      }>;
    },
    enabled: !!profileData?.resume,
  });

  const saveVersionMutation = useMutation({
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
      setSaveOpen(false);
      setSaveLabel("");
      toast("success", "Version saved");
    },
    onError: () => toast("error", "Failed to save version"),
  });

  const resume = profileData?.resume;
  const stats = [
    { label: "Experiences", count: resume?.experiences?.length ?? 0, icon: Briefcase, color: "text-blue-500" },
    { label: "Education", count: resume?.education?.length ?? 0, icon: GraduationCap, color: "text-green-500" },
    { label: "Skills", count: resume?.skills?.length ?? 0, icon: Wrench, color: "text-purple-500" },
    { label: "Certifications", count: resume?.certifications?.length ?? 0, icon: Award, color: "text-amber-500" },
    { label: "Awards", count: resume?.awards?.length ?? 0, icon: Star, color: "text-rose-500" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <FileText className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load resume data</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Resume Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create your resume profile to get started</p>
        </div>
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No resume profile yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Create your resume profile to manage experiences, skills, and more.</p>
          <Link href="/dashboard/resume/profile">
            <Button className="mt-6">
              <Plus className="h-4 w-4" />
              Create Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Resume Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {resume.fullName} &middot; {resume.professionalTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSaveOpen(true)}>
            <History className="h-4 w-4" />
            Save Version
          </Button>
          <Link href="/resume" target="_blank">
            <Button variant="outline">
              <Eye className="h-4 w-4" />
              View Resume
            </Button>
          </Link>
          <Link href="/resume/print" target="_blank">
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("rounded-lg p-2", stat.color, "bg-zinc-100 dark:bg-zinc-800")}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ATS Score */}
      {atsResult && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">ATS Score</h2>
              <Link href="/dashboard/resume/ats">
                <Button variant="ghost" size="sm">
                  <Search className="h-3.5 w-3.5" />
                  Details
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold",
                atsResult.overall >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                atsResult.overall >= 60 ? "bg-badge-warning-bg text-badge-warning-text" :
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {atsResult.overall}
              </div>
              <div className="flex-1 space-y-2">
                {atsResult.sections.slice(0, 4).map((section) => {
                  const pct = section.maxScore > 0 ? Math.round((section.score / section.maxScore) * 100) : 0;
                  return (
                    <div key={section.name} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground dark:text-zinc-400">{section.name}</span>
                        <span className="text-zinc-500">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions + Status */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                >
                  <action.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{action.label}</span>
                  <ArrowUpRight className="ml-auto h-3 w-3 shrink-0 text-zinc-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status & Template */}
        <div className="space-y-4">
          {/* Template */}
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">Current Template</h2>
              <Badge variant="outline" className="text-sm px-3 py-1">
                <Globe className="h-3.5 w-3.5" />
                {TEMPLATES[resume.template] || resume.template}
              </Badge>
            </CardContent>
          </Card>

          {/* Published Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Published Status</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {resume.published ? "Your resume is live" : "Your resume is hidden"}
                  </p>
                </div>
                <button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    resume.published ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                  )}
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
                  ) : (
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                        resume.published ? "translate-x-[22px]" : "translate-x-[2px]"
                      )}
                    />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Download Stats */}
          {downloadStats && (
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">Total Downloads</h2>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                    <AnimatedCounter to={downloadStats.total} duration={1.5} />
                  </span>
                </div>
                {downloadStats.byTemplate.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Most downloaded: {downloadStats.byTemplate.sort((a, b) => b.count - a.count)[0]?.template}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section Views */}
          {sectionViews && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">Section Views</h2>
                  <Link href="/dashboard/resume/downloads">
                    <Button variant="ghost" size="sm">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-5 w-5 text-violet-500" />
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                    <AnimatedCounter to={sectionViews.totalViews} duration={1.5} />
                  </span>
                </div>
                {sectionViews.sections.length > 0 && (
                  <p className="text-xs text-zinc-500">
                    Most viewed: {sectionViews.sections[0]?.section}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
            value={saveLabel}
            onChange={(e) => setSaveLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saveVersionMutation.isPending) {
                saveVersionMutation.mutate(saveLabel);
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaveOpen(false); setSaveLabel(""); }}>
              Cancel
            </Button>
            <Button onClick={() => saveVersionMutation.mutate(saveLabel)} disabled={saveVersionMutation.isPending}>
              {saveVersionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
