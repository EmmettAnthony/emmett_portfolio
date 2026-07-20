"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTranslations } from "@/lib/i18n";

interface DashboardHeaderProps {
  user?: { name?: string | null; email?: string | null };
}

const pageTitleKeys: Record<string, string> = {
  "/dashboard/overview": "overview",
  "/dashboard/notifications/inbox": "inbox",
  "/dashboard/notifications/history": "history",
  "/dashboard/notifications/analytics": "notificationAnalytics",
  "/dashboard/notifications/templates": "notificationTemplates",
  "/dashboard/notifications/settings": "notificationSettings",
  "/dashboard/notifications": "notifications",
  "/dashboard/leads": "leadManagement",
  "/dashboard/clients": "clients",
  "/dashboard/projects": "projects",
  "/dashboard/portfolio": "portfolio",
  "/dashboard/blog": "blogPosts",
  "/dashboard/services": "services",
  "/dashboard/testimonials": "testimonials",
  "/dashboard/newsletter": "newsletter",
  "/dashboard/appointments": "appointments",
  "/dashboard/media": "mediaLibrary",
  "/dashboard/analytics": "analytics",
  "/dashboard/seo": "seo",
  "/dashboard/settings": "settings",
  "/dashboard/activity-logs": "activityLogs",
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const t = useTranslations("dashboard.header");
  const pathname = usePathname();
  const titleKey = Object.entries(pageTitleKeys).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] || "dashboard";
  const title = t(titleKey);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-xl border-sidebar-border">
      <div>
        <h1 className="text-lg font-bold text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-2 border-l pl-3 border-sidebar-border">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0] || "A"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {user?.name || t("admin")}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
