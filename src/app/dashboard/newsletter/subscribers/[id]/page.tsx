"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Mail,
  User,
  Phone,
  Building2,
  Globe,
  Tag,
  Edit3,
  Trash2,
  Save,
  X,
  Activity,
  Clock,
  MousePointerClick,
  Eye,
  AlertCircle,
  Calendar,
  Bell,
  Newspaper,
  Megaphone,
  BookOpen,
  Shield,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { TimezoneSelect } from "@/components/ui/newsletter/TimezoneSelect";
import type {
  Subscriber,
  SubscriberPreference,
  CampaignEvent,
  EmailLog,
  SubscriberStatus,
  EmailEventType,
} from "@/types/newsletter";

const statusColors: Record<SubscriberStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UNSUBSCRIBED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  BOUNCED: "bg-badge-warning-bg text-badge-warning-text",
  PENDING_VERIFICATION: "bg-badge-info-bg text-badge-info-text",
};

const eventIcons: Record<EmailEventType, typeof Activity> = {
  sent: Mail,
  opened: Eye,
  clicked: MousePointerClick,
  bounced: AlertCircle,
  unsubscribed: X,
  complained: AlertCircle,
};

const eventColors: Record<EmailEventType, string> = {
  sent: "text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  opened: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  clicked: "text-violet-500 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
  bounced: "text-amber-500 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
  unsubscribed: "text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  complained: "text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
};

interface SubscriberResponse {
  subscriber: Subscriber & { preferences?: SubscriberPreference | null };
}

export default function SubscriberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTimezone, setEditingTimezone] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showGdprDelete, setShowGdprDelete] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    notes: "",
  });

  const { data, isLoading, error } = useQuery<SubscriberResponse>({
    queryKey: ["newsletter-subscriber", id],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/subscribers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch subscriber");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: events } = useQuery<CampaignEvent[]>({
    queryKey: ["newsletter-subscriber-events", id],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/events?subscriberId=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const { data: emailLogs } = useQuery<EmailLog[]>({
    queryKey: ["newsletter-subscriber-emaillogs", id],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/email-logs?subscriberId=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/subscribers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subscriber");
    },
    onSuccess: () => {
      toast("success", "Subscriber deleted");
      router.push("/dashboard/newsletter/subscribers");
    },
    onError: () => toast("error", "Failed to delete subscriber"),
  });

  const updateMutation = useMutation({
    mutationFn: async (body: typeof editForm) => {
      const res = await fetch(`/api/newsletter/subscribers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update subscriber");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscriber", id] });
      toast("success", "Subscriber updated");
      setIsEditing(false);
    },
    onError: () => toast("error", "Failed to update subscriber"),
  });

  const timezoneMutation = useMutation({
    mutationFn: async (timezone: string) => {
      const res = await fetch(`/api/newsletter/subscribers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });
      if (!res.ok) throw new Error("Failed to update timezone");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscriber", id] });
      toast("success", "Timezone updated");
      setEditingTimezone(false);
    },
    onError: () => toast("error", "Failed to update timezone"),
  });

  const subscriber = data?.subscriber;
  const preferences = subscriber?.preferences;

  const startEditing = () => {
    if (!subscriber) return;
    setEditForm({
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      email: subscriber.email,
      phone: subscriber.phone ?? "",
      company: subscriber.company ?? "",
      country: subscriber.country ?? "",
      notes: subscriber.notes ?? "",
    });
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !subscriber) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <User className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load subscriber</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/newsletter/subscribers")}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {subscriber.firstName} {subscriber.lastName}
              </h1>
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[subscriber.status])}>
                {subscriber.status === "PENDING_VERIFICATION" ? "Pending" : subscriber.status.charAt(0) + subscriber.status.slice(1).toLowerCase()}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subscriber.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Edit Subscriber</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">First Name</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Last Name</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Company</label>
              <input
                type="text"
                value={editForm.company}
                onChange={(e) => setEditForm((p) => ({ ...p, company: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Country</label>
              <input
                type="text"
                value={editForm.country}
                onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Notes</label>
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={() => updateMutation.mutate(editForm)}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Subscriber Info */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Subscriber Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Name</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">
                      {subscriber.firstName} {subscriber.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Email</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{subscriber.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Phone</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{subscriber.phone ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Company</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{subscriber.company ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Country</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{subscriber.country ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Timezone</p>
                    {editingTimezone ? (
                      <div className="mt-0.5">
                        <TimezoneSelect
                          value={subscriber.timezone}
                          onChange={(tz) => timezoneMutation.mutate(tz)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-zinc-900 dark:text-white truncate">
                          {subscriber.timezone ? subscriber.timezone.replace(/_/g, " ").replace(/\//g, " / ") : "—"}
                        </p>
                        <button
                          onClick={() => setEditingTimezone(true)}
                          className="shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800 dark:hover:text-muted-foreground"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {subscriber.timezone && !editingTimezone && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        Local time:{" "}
                        {new Date().toLocaleString("en-US", {
                          timeZone: subscriber.timezone,
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Tags</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">
                      {subscriber.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {subscriber.tags.split(",").map((tag, i) => (
                            <span key={i} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">{tag.trim()}</span>
                          ))}
                        </div>
                      ) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Subscribed</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">
                      {new Date(subscriber.subscribedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Last Opened</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">
                      {subscriber.lastOpenedAt ? new Date(subscriber.lastOpenedAt).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                    subscriber.engagementScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                    subscriber.engagementScore >= 40 ? "bg-blue-100 text-blue-700" :
                    subscriber.engagementScore >= 20 ? "bg-amber-100 text-amber-700" :
                    "bg-zinc-100 text-zinc-500"
                  )}>
                    {subscriber.engagementScore}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Engagement Score</p>
                    <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">
                      {subscriber.engagementScore >= 70 ? "Highly Engaged" :
                       subscriber.engagementScore >= 40 ? "Moderately Engaged" :
                       subscriber.engagementScore >= 20 ? "Low Engagement" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Activity Timeline</h3>
              </div>
              {!events || events.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-zinc-500">
                  <Activity className="mb-2 h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">No activity yet</p>
                  <p className="mt-1 text-xs">Events will appear once campaigns are sent.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {events.slice(0, 20).map((event) => {
                    const Icon = eventIcons[event.eventType as EmailEventType] || Activity;
                    return (
                      <div key={event.id} className="flex items-start gap-3 px-6 py-3.5">
                        <div className={cn("rounded-lg p-1.5", eventColors[event.eventType as EmailEventType] || "bg-zinc-100 text-zinc-500 dark:bg-zinc-800")}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-900 dark:text-white capitalize">
                            {event.eventType}
                          </p>
                          {Boolean((event.metadata as Record<string, string>)?.url) && (
                            <p className="mt-0.5 text-xs text-zinc-500 truncate">{(event.metadata as Record<string, string>).url}</p>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 whitespace-nowrap">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Email History */}
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Email History</h3>
              </div>
              {!emailLogs || emailLogs.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-zinc-500">
                  <Mail className="mb-2 h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">No emails sent yet</p>
                  <p className="mt-1 text-xs">Email history will appear here once campaigns are sent.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Sent</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Opened</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Clicked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {emailLogs.slice(0, 20).map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-6 py-3.5 text-sm font-medium text-zinc-900 dark:text-white">
                            {log.subject ?? "—"}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              log.status === "sent" && "bg-badge-info-bg text-badge-info-text",
                              log.status === "opened" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                              log.status === "clicked" && "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
                              log.status === "bounced" && "bg-badge-warning-bg text-badge-warning-text",
                              log.status === "failed" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            )}>
                              {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-sm text-muted-foreground dark:text-zinc-400">
                            {log.sentAt ? new Date(log.sentAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-muted-foreground dark:text-zinc-400">
                            {log.openedAt ? new Date(log.openedAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-muted-foreground dark:text-zinc-400">
                            {log.clickedAt ? new Date(log.clickedAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Preferences */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Preferences</h2>
              {preferences ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Frequency</p>
                    <p className="mt-1 text-sm text-zinc-900 dark:text-white capitalize">{preferences.emailFrequency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Topics</p>
                    <p className="mt-1 text-sm text-zinc-900 dark:text-white">
                      {preferences.topics ? (
                        <div className="flex flex-wrap gap-1">
                          {preferences.topics.split(",").map((t, i) => (
                            <span key={i} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">{t.trim()}</span>
                          ))}
                        </div>
                      ) : "None selected"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Newspaper className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-sm text-muted-foreground dark:text-zinc-400">Newsletters</span>
                      </div>
                      <span className={cn("h-2 w-2 rounded-full", preferences.receiveNewsletters ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600")} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-sm text-muted-foreground dark:text-zinc-400">Promotions</span>
                      </div>
                      <span className={cn("h-2 w-2 rounded-full", preferences.receivePromotions ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600")} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-sm text-muted-foreground dark:text-zinc-400">Blog Updates</span>
                      </div>
                      <span className={cn("h-2 w-2 rounded-full", preferences.receiveBlogUpdates ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600")} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-zinc-500">
                  <Bell className="mb-2 h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
                  <p className="text-sm text-zinc-500">No preferences set</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Activity Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Events</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">{events?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Emails Sent</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">{emailLogs?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Last Opened</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {subscriber.lastOpenedAt ? new Date(subscriber.lastOpenedAt).toLocaleDateString() : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Last Clicked</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {subscriber.lastClickedAt ? new Date(subscriber.lastClickedAt).toLocaleDateString() : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GDPR Privacy Section */}
      {!isEditing && (
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setShowPrivacy(!showPrivacy)}
            className="flex w-full items-center justify-between px-6 py-4"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Privacy</h3>
            </div>
            {showPrivacy ? (
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            )}
          </button>
          {showPrivacy && (
            <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                Manage this subscriber&apos;s data in accordance with GDPR privacy regulations.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      const res = await fetch(`/api/newsletter/subscribers/${id}/gdpr-export`);
                      if (!res.ok) throw new Error("Export failed");
                      const data = await res.json();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `gdpr-export-${id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast("success", "GDPR data exported");
                    } catch {
                      toast("error", "Failed to export GDPR data");
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export Data
                </button>
                <button
                  onClick={() => setShowGdprDelete(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All Data (GDPR)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GDPR Delete Confirmation */}
      {showGdprDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete All Data (GDPR)</h2>
            <p className="mt-2 text-sm text-zinc-500">
              This will permanently anonymize all personal data for{" "}
              <span className="font-medium text-zinc-700 dark:text-muted-foreground">
                {subscriber.firstName} {subscriber.lastName}
              </span>
              . The email will be replaced, name anonymized, and all personal fields cleared. This action is{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">irreversible</span>.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Anonymized records will be kept for analytics integrity.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowGdprDelete(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/newsletter/subscribers/${id}/gdpr-delete`, { method: "DELETE" });
                    if (!res.ok) throw new Error("Failed to anonymize");
                    toast("success", "Subscriber data anonymized for GDPR");
                    router.push("/dashboard/newsletter/subscribers");
                  } catch {
                    toast("error", "Failed to anonymize subscriber data");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Yes, Anonymize All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Subscriber</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Are you sure you want to delete <span className="font-medium text-zinc-700 dark:text-muted-foreground">{subscriber.firstName} {subscriber.lastName}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
