"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/i18n";

interface ATSResult {
  overall: number;
  sections: {
    name: string;
    score: number;
    maxScore: number;
    tips: string[];
  }[];
  tips: string[];
}

export default function ATSPage() {
  const t = useTranslations("dashboard.resumeAts");
  const { data, isLoading, error } = useQuery<ATSResult>({
    queryKey: ["resume-ats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/ats");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to check ATS score");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Search className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">{t("failedToLoadATSScore")}</p>
        <p className="mt-1 text-sm">{t("createResumeProfileFirst")}</p>
        <Link href="/dashboard/resume/profile">
          <Button className="mt-4">{t("createProfile")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/resume"
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("atsScoreChecker")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("atsScoreCheckerDesc")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div
              className={cn(
                "flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold",
                data.overall >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                data.overall >= 60 ? "bg-badge-warning-bg text-badge-warning-text" :
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {data.overall}
            </div>
            <p className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
              {data.overall >= 80 ? t("great") : data.overall >= 60 ? t("good") : t("needsWork")}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {data.overall >= 80 ? t("wellOptimized") :
               data.overall >= 60 ? t("someImprovements") :
               t("significantImprovements")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sectionScores")}</CardTitle>
            <CardDescription>{t("breakdownByCategory")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.sections.map((section) => {
              const pct = section.maxScore > 0 ? Math.round((section.score / section.maxScore) * 100) : 0;
              return (
                <div key={section.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-700 dark:text-muted-foreground">{section.name}</span>
                    <span className="text-zinc-500">{section.score}/{section.maxScore}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
          </CardContent>
        </Card>
      </div>

      {data.sections.some((s) => s.tips.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {t("improvementTips")}
            </CardTitle>
            <CardDescription>{t("suggestionsToImprove")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.sections
                .filter((s) => s.tips.length > 0)
                .map((section) => (
                  <div key={section.name}>
                    <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">{section.name}</h4>
                    <ul className="space-y-2">
                      {section.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground dark:text-zinc-400">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
