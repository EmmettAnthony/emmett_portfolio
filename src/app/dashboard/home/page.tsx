"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  LayoutDashboard, Image, BarChart3, ShoppingBag, FolderKanban,
  Star, Layers, MessageCircle, Mail, ArrowUpRight, Eye, Globe,
  Settings, Wrench, Heart, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/i18n";

interface HomepageData {
  homepage: {
    id: string;
    heroHeadline: string;
    heroSubheadline: string | null;
    published: boolean;
    trustedLogos: { id: string }[];
    homepageStats: { id: string }[];
    homepageTechs: { id: string }[];
    whyChooseItems: Record<string, unknown>[];
    processSteps: Record<string, unknown>[];
    faqs: Record<string, unknown>[];
  };
}

const SECTIONS = (t: ReturnType<typeof useTranslations>) => [
  { label: t("heroSettings"), href: "/dashboard/home/hero", icon: Image, desc: t("heroSettingsDesc") },
  { label: t("statistics"), href: "/dashboard/home/stats", icon: BarChart3, desc: t("statisticsDesc") },
  { label: t("trustedLogos"), href: "/dashboard/home/logos", icon: Heart, desc: t("trustedLogosDesc") },
  { label: t("technologies"), href: "/dashboard/home/technologies", icon: Wrench, desc: t("technologiesDesc") },
  { label: t("workProcess"), href: "/dashboard/home/process", icon: Layers, desc: t("workProcessDesc") },
  { label: t("faqs"), href: "/dashboard/home/faqs", icon: MessageCircle, desc: t("faqsDesc") },
  { label: t("ctaNewsletter"), href: "/dashboard/home/cta", icon: Mail, desc: t("ctaNewsletterDesc") },
  { label: t("settingsSeo"), href: "/dashboard/home/settings", icon: Settings, desc: t("settingsSeoDesc") },
];

const INTEGRATIONS = (t: ReturnType<typeof useTranslations>) => [
  { label: t("services"), href: "/dashboard/services", icon: ShoppingBag },
  { label: t("portfolio"), href: "/dashboard/portfolio", icon: FolderKanban },
  { label: t("testimonials"), href: "/dashboard/testimonials", icon: Star },
  { label: t("blog"), href: "/dashboard/blog", icon: Briefcase },
];

export default function HomeDashboard() {
  const t = useTranslations("dashboard.homePage");
  const sections = SECTIONS(t);
  const integrations = INTEGRATIONS(t);
  const { data, isLoading, error } = useQuery<HomepageData>({
    queryKey: ["dashboard-homepage"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/home");
      if (!res.ok) throw new Error("Failed to fetch homepage");
      return res.json();
    },
  });

  const hp = data?.homepage;

  const stats = [
    { label: t("trustedLogos"), count: hp?.trustedLogos?.length ?? 0, icon: Heart, color: "text-rose-500" },
    { label: t("statistics"), count: hp?.homepageStats?.length ?? 0, icon: BarChart3, color: "text-blue-500" },
    { label: t("technologies"), count: hp?.homepageTechs?.length ?? 0, icon: Wrench, color: "text-purple-500" },
    { label: t("whyChoose"), count: hp?.whyChooseItems?.length ?? 0, icon: Star, color: "text-amber-500" },
    { label: t("workSteps"), count: hp?.processSteps?.length ?? 0, icon: Layers, color: "text-green-500" },
    { label: t("faqs"), count: hp?.faqs?.length ?? 0, icon: MessageCircle, color: "text-indigo-500" },
  ];

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></CardContent></Card>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <LayoutDashboard className="mb-3 h-10 w-10 text-red-400" />
      <p className="text-lg font-medium text-red-600 dark:text-red-400">{t("failedToLoadHomepage")}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("homepage")}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">{hp?.heroHeadline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={hp?.published ? "default" : "secondary"} className={cn(hp?.published ? "bg-green-100 text-green-700" : "")}>
            <Globe className="mr-1 h-3 w-3" />{hp?.published ? t("published") : t("draft")}
          </Badge>
          <Link href="/" target="_blank"><Button variant="outline" size="sm"><Eye className="h-4 w-4" />{t("viewPage")}</Button></Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("rounded-lg p-2", s.color, "bg-zinc-100 dark:bg-zinc-800")}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{s.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Sections */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">{t("homepageSections")}</h2>
            <div className="grid grid-cols-1 gap-2">
              {sections.map((section) => (
                <Link key={section.href} href={section.href}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50">
                  <section.icon className="h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium text-zinc-900 dark:text-white">{section.label}</span>
                    <p className="text-xs text-zinc-400">{section.desc}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integrated Modules */}
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">{t("integratedModules")}</h2>
            <p className="mb-3 text-xs text-zinc-500">{t("integratedModulesDesc")}</p>
            <div className="grid grid-cols-1 gap-2">
              {integrations.map((mod) => (
                <Link key={mod.href} href={mod.href}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50">
                  <mod.icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-zinc-900 dark:text-white">{mod.label}</span>
                  <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
