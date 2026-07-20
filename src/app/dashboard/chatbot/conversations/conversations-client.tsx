"use client";

import { useState } from "react";
import {
  Search,
  MessageCircle,
  Mail,
  Clock,
  Bot,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

interface Conversation {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: string;
  source: string;
  language: string;
  messageCount: number;
  isHighPriority: boolean;
  tags: string[];
  createdAt: string;
  lastActivityAt: string;
  lead: { name: string; email: string; score?: number } | null;
  feedback: { score: number } | null;
  _count: { messages: number };
  messages: { role: string; content: string; createdAt: string }[];
}

const statusStyles = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  WAITING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ARCHIVED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  ESCALATED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function STATUS_TABS(t: ReturnType<typeof useTranslations>) {
  return [
    { value: "", label: t("all"), color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", activeColor: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" },
    { value: "ACTIVE", label: t("active"), color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", activeColor: "bg-green-600 text-white dark:bg-green-500 dark:text-white" },
    { value: "WAITING", label: t("waiting"), color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", activeColor: "bg-yellow-500 text-white" },
    { value: "ESCALATED", label: t("escalated"), color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", activeColor: "bg-red-600 text-white dark:bg-red-500 dark:text-white" },
    { value: "RESOLVED", label: t("resolved"), color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", activeColor: "bg-blue-600 text-white" },
    { value: "ARCHIVED", label: t("archived"), color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", activeColor: "bg-zinc-500 text-white" },
  ];
}

export function ConversationsClient({ initialData }: { initialData: Record<string, unknown> }) {
  const t = useTranslations("dashboard.chatbotConversations");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [data] = useState<Record<string, unknown>>(initialData);

  const filtered = data.conversations.filter((c: Conversation) => {
    if (search && !c.visitorName?.toLowerCase().includes(search.toLowerCase()) && !c.visitorEmail?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const escalatedCount = data.conversations.filter((c: Conversation) => c.status === "ESCALATED").length;

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS(t).map((tab) => {
          const isActive = statusFilter === tab.value;
          const count = tab.value
            ? data.conversations.filter((c: Conversation) => c.status === tab.value).length
            : data.total;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                isActive ? tab.activeColor : cn(tab.color, "hover:opacity-80")
              )}
            >
              {tab.label}
              <span className={cn(
                "tabular-nums",
                isActive ? "opacity-80" : "opacity-60"
              )}>
                {count}
              </span>
              {tab.value === "ESCALATED" && escalatedCount > 0 && !isActive && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {escalatedCount > 9 ? "9+" : escalatedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search and results count */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchConversations")}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        </div>
        <span className="text-xs text-zinc-500">{t("xOfYConversations", { x: filtered.length, y: data.total })}</span>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{t("noConversationsFound")}</p>
          </div>
        ) : (
          filtered.map((conv: Conversation) => (
            <div key={conv.id}
              className="group rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    conv.isHighPriority ? "bg-red-100 dark:bg-red-900/30" : "bg-zinc-100 dark:bg-zinc-800"
                  )}>
                    {conv.visitorName ? (
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{conv.visitorName.charAt(0).toUpperCase()}</span>
                    ) : (
                      <Bot className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{conv.visitorName || t("anonymous")}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusStyles[conv.status as keyof typeof statusStyles] || "bg-zinc-100 text-zinc-500")}>{conv.status}</span>
                      {conv.isHighPriority && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">{t("highPriority")}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      {conv.visitorEmail && (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {conv.visitorEmail}</span>
                      )}
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {t("xMessages", { count: conv._count.messages })}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(conv.lastActivityAt).toLocaleDateString()}</span>
                    </div>

                    {conv.messages.length > 0 && (
                      <p className="mt-2 text-xs text-zinc-500 line-clamp-1 dark:text-zinc-400">{conv.messages[conv.messages.length - 1]?.content}</p>
                    )}
                  </div>
                </div>

                <Link href={"/dashboard/chatbot/conversations/" + conv.id}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 opacity-0 transition-all hover:bg-blue-50 group-hover:opacity-100 dark:text-blue-400 dark:hover:bg-blue-900/20">
                  {t("view")} <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {conv.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {conv.tags.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{tag}</span>
                  ))}
                </div>
              )}

              {conv.lead && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">{t("leadWithName", { name: conv.lead.name, email: conv.lead.email })}</div>
              )}
            </div>
          ))
        )}

        {data.total > data.conversations.length && (
          <div className="flex justify-center py-4">
              <button className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("loadMore")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
