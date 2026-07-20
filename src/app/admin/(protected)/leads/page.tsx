"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  projectType: string;
  budget: string | null;
  timeline: string | null;
  projectDetails: string;
  referralSource: string | null;
  fileName: string | null;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NEW: "bg-badge-info-bg text-badge-info-text",
  IN_PROGRESS: "bg-badge-warning-bg text-badge-warning-text",
  QUOTED: "bg-purple-500/10 text-purple-400",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/leads");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setLeads(data.leads);
        }
      } catch (err) {
        console.error("Failed to fetch leads:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/admin/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status } : l))
        );
        if (selectedLead?.id === id) {
          setSelectedLead({ ...selectedLead, status });
        }
      }
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
  };

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.fullName.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.projectType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    ALL: leads.length,
    NEW: leads.filter((l) => l.status === "NEW").length,
    IN_PROGRESS: leads.filter((l) => l.status === "IN_PROGRESS").length,
    QUOTED: leads.filter((l) => l.status === "QUOTED").length,
    WON: leads.filter((l) => l.status === "WON").length,
    LOST: leads.filter((l) => l.status === "LOST").length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
              Lead Management
            </h1>
            <p className="text-sm text-muted-foreground dark:text-zinc-400">
              {leads.length} total inquiries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeads}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === key
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              )}
            >
              {key === "ALL" ? "All" : key.replace("_", " ")} ({count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, or project type..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>

        {loading ? (
          <div className="mt-16 text-center text-sm text-zinc-500">
            Loading leads...
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center text-sm text-zinc-500">
            No leads found.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filtered.map((lead) => (
              <button
                key={lead.id}
                onClick={() =>
                  setSelectedLead(
                    selectedLead?.id === lead.id ? null : lead
                  )
                }
                className={cn(
                  "w-full rounded-2xl border bg-white p-5 text-left transition-all hover:shadow-md dark:bg-zinc-900",
                  selectedLead?.id === lead.id
                    ? "border-blue-500 shadow-md ring-1 ring-blue-500/30 dark:border-blue-400"
                    : "border-zinc-200 dark:border-zinc-800"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                      {lead.fullName}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground dark:text-zinc-400 truncate">
                      {lead.projectType}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(lead.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      statusColors[lead.status] || ""
                    )}
                  >
                    {lead.status.replace("_", " ")}
                  </span>
                </div>

                {lead.company && (
                  <p className="mt-2 text-xs text-zinc-500">{lead.company}</p>
                )}

                {selectedLead?.id === lead.id && (
                  <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <div className="space-y-2 text-sm">
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-2 text-blue-700 hover:underline dark:text-blue-400"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {lead.email}
                      </a>
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </a>
                      )}
                      {lead.budget && (
                        <p className="flex items-center gap-2 text-muted-foreground dark:text-zinc-400">
                          <span className="font-medium">Budget:</span>{" "}
                          {lead.budget}
                        </p>
                      )}
                      {lead.timeline && (
                        <p className="flex items-center gap-2 text-muted-foreground dark:text-zinc-400">
                          <span className="font-medium">Timeline:</span>{" "}
                          {lead.timeline}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                      <p className="text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                        {lead.projectDetails}
                      </p>
                    </div>

                    {/* Status actions */}
                    <div className="mt-4">
                      <label className="text-xs font-medium text-zinc-500">
                        Update Status
                      </label>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {["NEW", "IN_PROGRESS", "QUOTED", "WON", "LOST"].map(
                          (s) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(lead.id, s);
                              }}
                              className={cn(
                                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                                lead.status === s
                                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                  : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                              )}
                            >
                              {s.replace("_", " ")}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
