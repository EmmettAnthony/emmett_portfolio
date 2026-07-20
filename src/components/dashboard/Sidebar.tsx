"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  FileText,
  ShoppingBag,
  Star,
  Mail,
  Calendar,
  Image,
  BarChart3,
  Search,
  Settings,
  Target,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Tags,
  Layers,
  FileJson,
  Zap,
  PieChart,
  Inbox,
  Ban,
  Plus,
  Bell,
  Key,
  BookOpen,
  Rss,
  Webhook,
  MessageCircle,
  FileSearch,
  History,
  Eye,
  CalendarDays,
  CalendarClock,
  ListTodo,
  Building2,
  DollarSign,
  GitBranch,
  Receipt,
  FileSignature,
  ShieldAlert,
  HeartHandshake,
  Code,
  Globe,
  Send,
  List,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  {
    label: "Homepage",
    icon: LayoutDashboard,
    children: [
      { href: "/dashboard/home", label: "Dashboard", icon: PieChart },
      { href: "/dashboard/home/hero", label: "Hero & Settings", icon: Image },
      { href: "/dashboard/home/stats", label: "Statistics", icon: BarChart3 },
      { href: "/dashboard/home/logos", label: "Trusted Logos", icon: HeartHandshake },
      { href: "/dashboard/home/technologies", label: "Technologies", icon: Code },
      { href: "/dashboard/home/process", label: "Work Process", icon: Layers },
      { href: "/dashboard/home/faqs", label: "FAQs", icon: MessageCircle },
      { href: "/dashboard/home/cta", label: "CTA & Newsletter", icon: Mail },
      { href: "/dashboard/home/settings", label: "Settings & SEO", icon: Settings },
    ],
  },
  {
    href: "/dashboard/leads",
    label: "Leads CRM",
    icon: Users,
    children: [
      { href: "/dashboard/leads", label: "All Leads", icon: Users },
      { href: "/dashboard/leads/qualify", label: "Qualify Lead", icon: Star },
    ],
  },
  {
    label: "Chatbot",
    icon: MessageCircle,
    children: [
      { href: "/dashboard/chatbot", label: "Dashboard", icon: PieChart },
      { href: "/dashboard/chatbot/conversations", label: "Conversations", icon: MessageCircle },
      { href: "/dashboard/chatbot/leads", label: "Chat Leads", icon: Target },
      { href: "/dashboard/chatbot/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/chatbot/triggers", label: "Triggers Report", icon: Zap },
      { href: "/dashboard/chatbot/knowledge-base", label: "Knowledge Base", icon: BookOpen },
      { href: "/dashboard/chatbot/prompts", label: "Prompts", icon: FileText },
      { href: "/dashboard/chatbot/settings", label: "Settings", icon: Settings },
    ],
  },
  { href: "/dashboard/clients", label: "Clients", icon: Briefcase },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  {
    label: "Portfolio",
    icon: Layers,
    children: [
      { href: "/dashboard/portfolio", label: "Overview", icon: PieChart },
      { href: "/dashboard/portfolio/create", label: "Create Project", icon: Plus },
      { href: "/dashboard/portfolio/categories", label: "Categories", icon: Tags },
      { href: "/dashboard/portfolio/technologies", label: "Technologies", icon: Layers },
      { href: "/dashboard/portfolio/case-studies", label: "Case Studies", icon: FileJson },
      { href: "/dashboard/portfolio/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "CRM",
    icon: Users,
    children: [
      { href: "/dashboard/crm", label: "Overview", icon: PieChart },
      { href: "/dashboard/crm/leads", label: "Leads", icon: Users },
      { href: "/dashboard/crm/clients", label: "Clients", icon: Briefcase },
      { href: "/dashboard/crm/companies", label: "Companies", icon: Building2 },
      { href: "/dashboard/crm/deals", label: "Deals", icon: DollarSign },
      { href: "/dashboard/crm/pipeline", label: "Pipeline", icon: GitBranch },
      { href: "/dashboard/crm/activities", label: "Activities", icon: Activity },
      { href: "/dashboard/crm/communications", label: "Communications", icon: MessageCircle },
      { href: "/dashboard/crm/tasks", label: "Tasks", icon: ListTodo },
      { href: "/dashboard/crm/proposals", label: "Proposals", icon: FileText },
      { href: "/dashboard/crm/contracts", label: "Contracts", icon: FileSignature },
      { href: "/dashboard/crm/invoices", label: "Invoices", icon: Receipt },
      { href: "/dashboard/crm/reports", label: "Reports", icon: BarChart3 },
      { href: "/dashboard/crm/automations", label: "Automations", icon: Zap },
    ],
  },
  {
    label: "Resume",
    icon: FileText,
    children: [
      { href: "/dashboard/resume", label: "Overview", icon: PieChart },
      { href: "/dashboard/resume/preview", label: "Preview", icon: Eye },
      { href: "/dashboard/resume/profile", label: "Profile", icon: Users },
      { href: "/dashboard/resume/experience", label: "Experience", icon: Briefcase },
      { href: "/dashboard/resume/education", label: "Education", icon: BookOpen },
      { href: "/dashboard/resume/skills", label: "Skills", icon: Zap },
      { href: "/dashboard/resume/certifications", label: "Certifications", icon: Star },
      { href: "/dashboard/resume/awards", label: "Awards", icon: FileJson },
      { href: "/dashboard/resume/languages", label: "Languages", icon: MessageCircle },
      { href: "/dashboard/resume/references", label: "References", icon: Users },
      { href: "/dashboard/resume/featured-projects", label: "Featured Projects", icon: FolderKanban },
      { href: "/dashboard/resume/downloads", label: "Downloads", icon: BarChart3 },
      { href: "/dashboard/resume/ats", label: "ATS Score", icon: FileSearch },
      { href: "/dashboard/resume/versions", label: "Versions", icon: History },
    ],
  },
  { href: "/dashboard/blog", label: "Blog", icon: FileText },
  {
    label: "Services",
    icon: ShoppingBag,
    children: [
      { href: "/dashboard/services", label: "Overview", icon: PieChart },
      { href: "/dashboard/services/create", label: "Create Service", icon: Plus },
      { href: "/dashboard/services/categories", label: "Categories", icon: Tags },
      { href: "/dashboard/services/packages", label: "Packages", icon: Layers },
      { href: "/dashboard/services/faqs", label: "Global FAQs", icon: MessageCircle },
      { href: "/dashboard/services/inquiries", label: "Inquiries", icon: Inbox },
      { href: "/dashboard/services/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  { href: "/dashboard/testimonials", label: "Testimonials", icon: Star },
  {
    label: "Newsletter",
    icon: Mail,
    children: [
      { href: "/dashboard/newsletter", label: "Overview", icon: PieChart },
      { href: "/dashboard/newsletter/subscribers", label: "Subscribers", icon: Users },
      { href: "/dashboard/newsletter/campaigns", label: "Campaigns", icon: Inbox },
      { href: "/dashboard/newsletter/templates", label: "Templates", icon: FileJson },
      { href: "/dashboard/newsletter/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/newsletter/automation", label: "Automation", icon: Zap },
      { href: "/dashboard/newsletter/tags", label: "Tags", icon: Tags },
      { href: "/dashboard/newsletter/segments", label: "Segments", icon: Layers },
      { href: "/dashboard/newsletter/blocklist", label: "Blocklist", icon: Ban },
      { href: "/dashboard/newsletter/custom-fields", label: "Custom Fields", icon: FileJson },
      { href: "/dashboard/newsletter/api-keys", label: "API Keys", icon: Key },
      { href: "/dashboard/newsletter/api-docs", label: "API Docs", icon: BookOpen },
      { href: "/dashboard/newsletter/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/dashboard/newsletter/rss-to-email", label: "RSS to Email", icon: Rss },
      { href: "/dashboard/newsletter/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Calendar",
    icon: Calendar,
    children: [
      { href: "/dashboard/calendar", label: "Calendar View", icon: Calendar },
      { href: "/dashboard/calendar/events", label: "Events", icon: CalendarDays },
      { href: "/dashboard/calendar/appointments", label: "Appointments", icon: CalendarClock },
      { href: "/dashboard/calendar/tasks", label: "Tasks", icon: ListTodo },
      { href: "/dashboard/calendar/reminders", label: "Reminders", icon: Bell },
      { href: "/dashboard/calendar/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Contact",
    icon: MessageCircle,
    children: [
      { href: "/dashboard/contact", label: "Overview", icon: PieChart },
      { href: "/dashboard/contact/submissions", label: "Submissions", icon: Inbox },
      { href: "/dashboard/contact/faqs", label: "FAQs", icon: MessageCircle },
      { href: "/dashboard/contact/booking", label: "Booking", icon: Calendar },
      { href: "/dashboard/contact/emails", label: "Emails", icon: Mail },
      { href: "/dashboard/contact/templates", label: "Templates", icon: FileText },
    ],
  },
  {
    label: "Email",
    icon: Mail,
    children: [
      { href: "/dashboard/email/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/email/templates", label: "Templates", icon: FileJson },
      { href: "/dashboard/email/campaigns", label: "Campaigns", icon: Send },
      { href: "/dashboard/email/subscribers", label: "Subscribers", icon: Users },
      { href: "/dashboard/email/lists", label: "Contact Lists", icon: List },
      { href: "/dashboard/email/contacts", label: "Contacts", icon: Inbox },
      { href: "/dashboard/email/automation", label: "Automation", icon: Zap },
      { href: "/dashboard/email/transactional", label: "Transactional", icon: Mail },
      { href: "/dashboard/email/history", label: "History", icon: History },
      { href: "/dashboard/email/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/email/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Localization",
    icon: Globe,
    children: [
      { href: "/dashboard/languages", label: "Languages", icon: Globe },
      { href: "/dashboard/translations", label: "Translations", icon: FileText },
    ],
  },
  { href: "/dashboard/media", label: "Media", icon: Image },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/seo", label: "SEO", icon: Search },
  { href: "/dashboard/legal", label: "Legal Pages", icon: FileText },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { href: "/dashboard/settings", label: "General", icon: Settings },
      { href: "/dashboard/settings/form-fields", label: "Form Fields", icon: FileText },
    ],
  },
  {
    label: "Notifications",
    icon: Bell,
    children: [
      { href: "/dashboard/notifications", label: "Notification Center", icon: Bell },
      { href: "/dashboard/notifications/inbox", label: "Inbox", icon: Inbox },
      { href: "/dashboard/notifications/history", label: "History", icon: History },
      { href: "/dashboard/notifications/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/notifications/templates", label: "Templates", icon: FileText },
      { href: "/dashboard/notifications/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Activity",
    icon: Activity,
    children: [
      { href: "/dashboard/activity", label: "Dashboard", icon: Activity },
      { href: "/dashboard/activity/logs", label: "Activity Logs", icon: History },
      { href: "/dashboard/activity/audit", label: "Audit Trail", icon: FileSearch },
      { href: "/dashboard/activity/security", label: "Security", icon: ShieldAlert },
    ],
  },
];


interface NavItem {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  external?: boolean;
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Portfolio: true,
    Resume: true,
    Newsletter: true,
    Calendar: true,
  });
  const pathname = usePathname();

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname.startsWith(href);

  const renderNavItem = (item: NavItem) => {
    if (item.children) {
      const expanded = expandedSections[item.label] ?? false;
      const anyChildActive = item.children.some((c) => c.href && isActive(c.href));
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleSection(item.label)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              anyChildActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
                ) : (
                  <ChevronRightIcon className="h-3.5 w-3.5 text-sidebar-foreground/50" />
                )}
              </>
            )}
          </button>
          {!collapsed && expanded && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const active = child.href ? isActive(child.href) : false;
                const linkProps = child.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {};
                const Comp = child.external ? "a" : Link;
                return (
                  <Comp
                    key={child.href}
                    href={child.href || "#"}
                    {...linkProps}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{child.label}</span>
                  </Comp>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const IconComponent = item.icon;
    const active = item.href ? isActive(item.href) : false;
    return (
      <Link
        key={item.href}
        href={item.href || "#"}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? item.label : undefined}
      >
        <IconComponent className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 border-sidebar-border",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link
            href="/dashboard/overview"
            className="text-base font-bold tracking-tight text-sidebar-foreground"
          >
            Portfolio<span className="text-sidebar-primary">.</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Sign out */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
