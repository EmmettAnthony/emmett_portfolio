"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mail,
  FileText,
  Send,
  Users,
  List,
  Zap,
  History,
  Settings,
  BarChart3,
  Inbox,
} from "lucide-react";

const navigation = [
  { href: "/dashboard/email/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/email/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/email/campaigns", label: "Campaigns", icon: Send },
  { href: "/dashboard/email/subscribers", label: "Subscribers", icon: Users },
  { href: "/dashboard/email/lists", label: "Contact Lists", icon: List },
  { href: "/dashboard/email/contacts", label: "Contacts", icon: Inbox },
  { href: "/dashboard/email/automation", label: "Automation", icon: Zap },
  { href: "/dashboard/email/transactional", label: "Transactional", icon: Mail },
  { href: "/dashboard/email/history", label: "History", icon: History },
  { href: "/dashboard/email/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/email/settings", label: "Settings", icon: Settings },
];

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard/email/overview" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-brand-100 text-brand-700 shadow-sm dark:bg-brand-900/30 dark:text-brand-400"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
