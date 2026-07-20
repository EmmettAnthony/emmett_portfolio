"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TicketCheck,
  FolderKanban,
  Kanban,
  ArrowUpDown,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Zap,
  BarChart3,
  Settings,
  Activity,
  GitBranch,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const supportNav = [
  { href: "/dashboard/support", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/support/tickets", label: "Tickets", icon: TicketCheck },
  { href: "/dashboard/support/kanban", label: "Kanban", icon: Kanban },
  { href: "/dashboard/support/categories", label: "Categories", icon: FolderKanban },
  { href: "/dashboard/support/priorities", label: "Priorities", icon: ArrowUpDown },
  { href: "/dashboard/support/statuses", label: "Statuses", icon: CheckCircle2 },
  { href: "/dashboard/support/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/dashboard/support/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/dashboard/support/macros", label: "Macros", icon: Zap },
  { href: "/dashboard/support/automation-rules", label: "Automation", icon: GitBranch },
  { href: "/dashboard/support/ticket-templates", label: "Templates", icon: FileText },
  { href: "/dashboard/support/sla", label: "SLA", icon: Clock },
  { href: "/dashboard/support/audit-trail", label: "Audit Trail", icon: Activity },
  { href: "/dashboard/support/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/support/settings", label: "Settings", icon: Settings },
];

export default function SupportDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-info-bg text-badge-info-text">
            <TicketCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Support</h1>
            <p className="text-sm text-zinc-500">Manage support tickets, knowledge base, and FAQs</p>
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {supportNav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard/support"
            ? pathname === "/dashboard/support"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                active
                  ? "bg-badge-info-bg text-badge-info-text"
                  : "text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="min-h-[600px]">
        {children}
      </div>
    </div>
  );
}
