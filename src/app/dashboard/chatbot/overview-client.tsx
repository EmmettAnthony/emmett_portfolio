"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  Users,
  UserPlus,
  CalendarCheck,
  MessageSquare,
  Star,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";

interface Stats {
  totalConversations: number;
  todayConversations: number;
  activeConversations: number;
  totalLeads: number;
  todayLeads: number;
  totalMessages: number;
  avgSatisfaction: number;
  conversionRate: number;
}

export function ChatbotOverviewClient({ stats }: { stats: Stats }) {
  const t = useTranslations("dashboard.chatbotOverview");
  const cards = [
    {
      title: t("totalConversations"),
      value: stats.totalConversations,
      icon: MessageCircle,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: t("activeNow"),
      value: stats.activeConversations,
      icon: Users,
      color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      title: t("messagesSent"),
      value: stats.totalMessages,
      icon: MessageSquare,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: t("leadsCaptured"),
      value: stats.totalLeads,
      icon: UserPlus,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
    },
    {
      title: t("todaysConversations"),
      value: stats.todayConversations,
      icon: TrendingUp,
      color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
    {
      title: t("todaysLeads"),
      value: stats.todayLeads,
      icon: Sparkles,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
    },
    {
      title: t("avgSatisfaction"),
      value: `${(stats.avgSatisfaction * 20).toFixed(0)}%`,
      icon: Star,
      color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    {
      title: t("conversionRate"),
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div className={`rounded-lg p-2 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
            {card.value}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {card.title}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
