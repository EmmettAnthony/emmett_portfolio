"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  User,
  BarChart3,
  Wrench,
  Settings,
  MessageCircle,
  Heart,
  Briefcase,
  Star,
  ArrowUpRight,
  Eye,
  Globe,
  Layers,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AboutData {
  about: {
    id: string;
    fullName: string;
    professionalTitle: string;
    photo: string | null;
    published: boolean;
    statistics: { id: string }[];
    technologies: { id: string }[];
    whyWorkWithMe: Record<string, unknown>[];
    workProcess: Record<string, unknown>[];
    personalInterests: Record<string, unknown>[];
    socialLinks: Record<string, unknown>[];
    faqs: Record<string, unknown>[];
  };
}

const QUICK_ACTIONS = [
  { label: "Profile & Hero", href: "/dashboard/about/profile", icon: User, desc: "Name, title, photo, summary" },
  { label: "Statistics", href: "/dashboard/about/statistics", icon: BarChart3, desc: "Animated counters & stats" },
  { label: "Technologies", href: "/dashboard/about/technologies", icon: Wrench, desc: "Tech stack grid" },
  { label: "FAQs", href: "/dashboard/about/faqs", icon: MessageCircle, desc: "Frequently asked questions" },
  { label: "Social Links", href: "/dashboard/about/social-links", icon: Heart, desc: "LinkedIn, GitHub, etc." },
  { label: "Work Process", href: "/dashboard/about/work-process", icon: Layers, desc: "How I work steps" },
  { label: "Interests", href: "/dashboard/about/interests", icon: Star, desc: "Personal interests" },
  { label: "Settings & SEO", href: "/dashboard/about/settings", icon: Settings, desc: "Publishing & meta data" },
];

const INTEGRATIONS = [
  { label: "Timeline", href: "/dashboard/resume/experience", icon: Briefcase, desc: "Professional journey" },
  { label: "Skills", href: "/dashboard/resume/skills", icon: Wrench, desc: "Skills & expertise" },
  { label: "Education", href: "/dashboard/resume/education", icon: BookOpen, desc: "Academic background" },
  { label: "Certifications", href: "/dashboard/resume/certifications", icon: Star, desc: "Certifications" },
  { label: "Achievements", href: "/dashboard/resume/awards", icon: Star, desc: "Awards & achievements" },
];

export default function AboutDashboard() {
  const { data, isLoading, error } = useQuery<AboutData>({
    queryKey: ["dashboard-about"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/about");
      if (!res.ok) throw new Error("Failed to fetch about page");
      return res.json();
    },
  });

  const about = data?.about;

  const stats = [
    { label: "Statistics", count: about?.statistics?.length ?? 0, icon: BarChart3, color: "text-blue-500" },
    { label: "Technologies", count: about?.technologies?.length ?? 0, icon: Wrench, color: "text-purple-500" },
    { label: "FAQs", count: about?.faqs?.length ?? 0, icon: MessageCircle, color: "text-green-500" },
    { label: "Social Links", count: about?.socialLinks?.length ?? 0, icon: Heart, color: "text-rose-500" },
    { label: "Work Steps", count: about?.workProcess?.length ?? 0, icon: Layers, color: "text-amber-500" },
    { label: "Interests", count: about?.personalInterests?.length ?? 0, icon: Star, color: "text-indigo-500" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <User className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load about page data</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">About Page</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {about?.fullName} &middot; {about?.professionalTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={about?.published ? "default" : "secondary"} className={cn(about?.published ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "")}>
            <Globe className="mr-1 h-3 w-3" />
            {about?.published ? "Published" : "Draft"}
          </Badge>
          <Link href="/about" target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
              View Page
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">About Page Sections</h2>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                >
                  <action.icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-zinc-900 dark:text-white">{action.label}</span>
                    <p className="text-xs text-zinc-400">{action.desc}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integrated Sections */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Integrated Sections</h2>
            <p className="mb-3 text-xs text-zinc-500">These sections are managed in other parts of the dashboard and automatically displayed on the About page.</p>
            <div className="grid grid-cols-1 gap-2">
              {INTEGRATIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                >
                  <action.icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-zinc-900 dark:text-white">{action.label}</span>
                    <p className="text-xs text-zinc-400">{action.desc}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Preview */}
      {about && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white">
                {about.fullName?.split(" ").map((n: string) => n[0]).join("") || "EA"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{about.fullName}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{about.professionalTitle}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    {about.statistics?.length ?? 0} statistics
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Wrench className="mr-1 h-3 w-3" />
                    {about.technologies?.length ?? 0} technologies
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <MessageCircle className="mr-1 h-3 w-3" />
                    {about.faqs?.length ?? 0} FAQs
                  </Badge>
                </div>
              </div>
              <Link href="/dashboard/about/profile">
                <Button size="sm">
                  <User className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
