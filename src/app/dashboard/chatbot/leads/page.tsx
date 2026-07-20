"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Download,
  Mail,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  QUALIFIED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CONTACTED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONVERTED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DISMISSED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface ChatLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  budget: string | null;
  timeline: string | null;
  requirements: string;
  projectType: string | null;
  leadScore: number | null;
  priority: string;
  status: string;
  createdAt: string;
  conversationId: string;
}

export default function ChatLeadsPage() {
  const t = useTranslations("dashboard.chatbotLeads");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["chat-leads"],
    queryFn: async () => {
      const res = await fetch("/api/chat/leads");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json().then((d) => d.leads as ChatLead[]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat-leads"] }),
  });

  const leads = data || [];
  const filtered = leads.filter((lead) => {
    const matchesSearch = !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.company || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const csv = [
      t("csvHeader"),
      ...leads.map((l) =>
        [l.name, l.email, l.phone || "", l.company || "", l.budget || "", l.timeline || "", l.priority, l.status, new Date(l.createdAt).toLocaleDateString()].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-leads.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("chatbotLeads")}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("chatbotLeadsDesc")}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchLeads")}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "NEW", "QUALIFIED", "CONTACTED", "CONVERTED", "DISMISSED"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all", statusFilter === s ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400")}>
              {s === "ALL" ? t("all") : t(s.toLowerCase())}
            </button>
          ))}
        </div>
        <button onClick={exportCSV}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground">
          <Download className="h-3.5 w-3.5" /> {t("exportCsv")}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-zinc-500">{t("loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-zinc-500">{t("noLeadsFound")}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">{t("name")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">{t("contact")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">{t("priority")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">{t("status")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">{t("score")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">{t("date")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedId(selectedId === lead.id ? null : lead.id)}
                      className="font-medium text-zinc-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-400">
                      {lead.name}
                    </button>
                    {lead.company && <p className="text-xs text-zinc-500">{lead.company}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-zinc-700 dark:text-muted-foreground">{lead.email}</p>
                    {lead.phone && <p className="text-xs text-zinc-500">{lead.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", priorityColors[lead.priority])}>{lead.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", statusColors[lead.status])}>{lead.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{lead.leadScore ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <a href={`mailto:${lead.email}`} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Mail className="h-3.5 w-3.5" /></a>
                      {lead.phone && <a href={`tel:${lead.phone}`} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Phone className="h-3.5 w-3.5" /></a>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId && (() => {
        const lead = leads.find((l) => l.id === selectedId);
        if (!lead) return null;
        return (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">{t("detailsFor", { name: lead.name })}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-zinc-500">{t("emailLabel")}</span> {lead.email}</p>
                <p><span className="font-medium text-zinc-500">{t("phoneLabel")}</span> {lead.phone || t("na")}</p>
                <p><span className="font-medium text-zinc-500">{t("companyLabel")}</span> {lead.company || t("na")}</p>
                <p><span className="font-medium text-zinc-500">{t("budgetLabel")}</span> {lead.budget || t("na")}</p>
                <p><span className="font-medium text-zinc-500">{t("timelineLabel")}</span> {lead.timeline || t("na")}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-zinc-500">{t("projectTypeLabel")}</span> {lead.projectType || t("na")}</p>
                <p><span className="font-medium text-zinc-500">{t("scoreLabel")}</span> {lead.leadScore ?? t("na")}</p>
                <p><span className="font-medium text-zinc-500">{t("priorityLabel")}</span> {lead.priority}</p>
                <p><span className="font-medium text-zinc-500">{t("submittedLabel")}</span> {new Date(lead.createdAt).toLocaleDateString()}</p>
                <div>
                  <span className="font-medium text-zinc-500">{t("statusLabel")}:</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {["NEW", "QUALIFIED", "CONTACTED", "CONVERTED", "DISMISSED"].map((s) => (
                      <button key={s} onClick={() => statusMutation.mutate({ id: lead.id, status: s })}
                        className={cn("rounded-md px-2 py-0.5 text-xs font-medium transition-all", lead.status === s ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400")}>
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-2">{t("requirements")}</h4>
              <p className="text-sm text-muted-foreground dark:text-zinc-400 leading-relaxed">{lead.requirements}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
