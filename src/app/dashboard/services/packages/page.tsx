"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Layers,
  Star,
  Clock
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import type { ServicePackage } from "@/types/services";
import { useTranslations } from "@/lib/i18n";

interface PackageWithService extends ServicePackage {
  service?: { id: string; title: string; slug: string; icon: string | null } | null;
}

export default function PackagesPage() {
  const t = useTranslations("dashboard.services");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ packages: PackageWithService[] }>({
    queryKey: ["dashboard-service-packages", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "50", ...(search && { search }) });
      const res = await fetch(`/api/dashboard/services/packages?${params}`);
      if (!res.ok) throw new Error("Failed to fetch packages");
      return res.json();
    },
  });

  const packages = data?.packages ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("packages")}</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("totalPackages", { count: packages.length })}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input type="text" placeholder={t("searchPackages")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : packages.length === 0 ? (
        <EmptyState icon={Layers} title={t("noPackagesFound")} description={search ? t("adjustSearch") : t("packagesCreatedWhenEditing")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-blue-500/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate">{pkg.name}</h3>
                    {pkg.isPopular && <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />}
                  </div>
                  {pkg.service && (
                    <button onClick={() => router.push(`/dashboard/services/${pkg.service?.id}`)} className="mt-0.5 text-xs text-blue-600 hover:underline dark:text-blue-400 truncate block">
                      {pkg.service?.icon ?? ""} {pkg.service?.title}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-bold text-zinc-900 dark:text-white">${pkg.price.toLocaleString()}</span>
              </div>
              {pkg.description && <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{pkg.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {pkg.deliveryTime && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                    <Clock className="h-3 w-3" /> {pkg.deliveryTime}
                  </span>
                )}
                {pkg.revisions > 0 && (
                  <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                    {t("revisionsCount", { count: pkg.revisions })}
                  </span>
                )}
              </div>
              {pkg.features.length > 0 && (
                <div className="mt-3 space-y-1">
                  {pkg.features.slice(0, 4).map((f, i) => (
                    <p key={i} className="text-xs text-muted-foreground dark:text-zinc-400 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-blue-500 shrink-0" /> {f}
                    </p>
                  ))}
                  {pkg.features.length > 4 && <p className="text-xs text-zinc-400">{t("moreCount", { count: pkg.features.length - 4 })}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
