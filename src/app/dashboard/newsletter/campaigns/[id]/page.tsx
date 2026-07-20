"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Send,
  Save,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Mail,
  BarChart3,
  Ban,
  Smartphone,
  Monitor,
  GitBranch,
  ArrowUpCircle,
  ThumbsUp,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
  Code,
  Layout,
  Globe,
  Link2,
  ExternalLink,
  Users,
  Repeat,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { createCampaignSchema } from "@/lib/validations/newsletter";
import { chiSquarePValue, formatPValue, isSignificant } from "@/lib/stats";
import type { Campaign, CampaignStatus, Template, Segment } from "@/types/newsletter";
import EmailEditor from "@/components/newsletter/editor/EmailEditor";
import { buildEmailFromBlocks } from "@/lib/email";

const statusConfig: Record<CampaignStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground" },
  REVIEW: { label: "In Review", color: "bg-badge-warning-bg text-badge-warning-text" },
  APPROVED: { label: "Approved", color: "bg-badge-success-bg text-badge-success-text" },
  SCHEDULED: { label: "Scheduled", color: "bg-badge-info-bg text-badge-info-text" },
  SENDING: { label: "Sending", color: "bg-badge-warning-bg text-badge-warning-text" },
  AWAITING_WINNER: { label: "A/B Testing", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  SENT: { label: "Sent", color: "bg-badge-success-bg text-badge-success-text" },
  PAUSED: { label: "Paused", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CANCELLED: { label: "Cancelled", color: "bg-badge-error-bg text-badge-error-text" },
  FAILED: { label: "Failed", color: "bg-badge-error-bg text-badge-error-text" },
};

export default function CampaignDetailPage() {

  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "gmail" | "outlook" | "apple">("desktop");
  const [showAbTest, setShowAbTest] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSpamCheck, setShowSpamCheck] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [editorMode, setEditorMode] = useState<"visual" | "source">("visual");
  const [blocks, setBlocks] = useState("");

  const { data: campaign, isLoading, error } = useQuery<Campaign>({
    queryKey: ["newsletter-campaign", id],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: templates } = useQuery<Template[]>({
    queryKey: ["newsletter-templates"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const { data: dailyData } = useQuery({
    queryKey: ["newsletter-campaign-daily", id],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}/daily-stats`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id && campaign?.status === "SENT",
  });

  const { data: segments } = useQuery<Segment[]>({
    queryKey: ["newsletter-segments"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/subscribers/segments");
      if (!res.ok) throw new Error("Failed to fetch segments");
      return res.json();
    },
  });

  const [editForm, setEditForm] = useState({
    name: "",
    subject: "",
    previewText: "",
    senderName: "",
    senderEmail: "",
    content: "",
    templateId: "",
    segmentId: "",
    scheduledAt: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: segmentPreview } = useQuery<{ count: number }>({
    queryKey: ["segment-preview", editForm.segmentId],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/segments/preview-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId: editForm.segmentId || null }),
      });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
  });

  const { data: clickStats } = useQuery<{ links: Array<{ url: string; clicks: number; uniqueClicks: number; lastClicked: string }>; totalClicks: number }>({
    queryKey: ["campaign-click-stats", id],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}/click-stats`);
      if (!res.ok) return { links: [], totalClicks: 0 };
      return res.json();
    },
    enabled: !!id && campaign?.status === "SENT",
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id }),
      });
      if (!res.ok) throw new Error("Failed to send campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaign", id] });
      toast("success", "Campaign queued for sending");
    },
    onError: () => toast("error", "Failed to send campaign"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate campaign");
      return res.json();
    },
    onSuccess: (result) => {
      toast("success", "Campaign duplicated");
      router.push(`/dashboard/newsletter/campaigns/${result.id}`);
    },
    onError: () => toast("error", "Failed to duplicate campaign"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
    },
    onSuccess: () => {
      toast("success", "Campaign deleted");
      router.push("/dashboard/newsletter/campaigns");
    },
    onError: () => toast("error", "Failed to delete campaign"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaign", id] });
      toast("success", "Campaign updated");
      setIsEditing(false);
    },
    onError: () => toast("error", "Failed to update campaign"),
  });

  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVIEW", submittedForReviewAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to submit for review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaign", id] });
      toast("success", "Campaign submitted for review");
    },
    onError: () => toast("error", "Failed to submit for review"),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", approvedAt: new Date().toISOString(), reviewNotes: reviewNotes || null }),
      });
      if (!res.ok) throw new Error("Failed to approve campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaign", id] });
      toast("success", "Campaign approved");
      setReviewNotes("");
    },
    onError: () => toast("error", "Failed to approve campaign"),
  });

  const requestChangesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT", approvedAt: null, reviewNotes: reviewNotes || null }),
      });
      if (!res.ok) throw new Error("Failed to request changes");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaign", id] });
      toast("success", "Changes requested — campaign returned to draft");
      setReviewNotes("");
    },
    onError: () => toast("error", "Failed to request changes"),
  });

  const togglePublicMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
      });
      if (!res.ok) throw new Error("Failed to toggle visibility");
      return res.json();
    },
    onSuccess: (_, isPublic) => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaign", id] });
      toast("success", isPublic ? "Published to archive" : "Removed from archive");
    },
    onError: () => toast("error", "Failed to toggle archive visibility"),
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT", scheduledAt: null }),
      });
      if (!res.ok) throw new Error("Failed to cancel schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-campaign", id] });
      toast("success", "Schedule cancelled");
    },
    onError: () => toast("error", "Failed to cancel schedule"),
  });

  const sendTestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id, test: true }),
      });
      if (!res.ok) throw new Error("Failed to send test");
      return res.json();
    },
    onSuccess: () => toast("success", "Test email sent"),
    onError: () => toast("error", "Failed to send test email"),
  });

  const spamCheckMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/newsletter/spam-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Spam check failed");
      return res.json() as Promise<{ score: number; flags: string[]; level: "safe" | "moderate" | "high" }>;
    },
    onError: () => toast("error", "Failed to run spam check"),
  });

  const startEditing = () => {
    if (!campaign) return;
    setEditForm({
      name: campaign.name,
      subject: campaign.subject,
      previewText: campaign.previewText ?? "",
      senderName: campaign.senderName ?? "",
      senderEmail: campaign.senderEmail ?? "",
      content: campaign.content,
      templateId: campaign.templateId ?? "",
      segmentId: campaign.segmentId ?? "",
      scheduledAt: campaign.scheduledAt ?? "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const result = createCampaignSchema.safeParse({
      ...editForm,
      content: editForm.content || undefined,
      scheduledAt: editForm.scheduledAt ? new Date(editForm.scheduledAt).toISOString() : null,
      senderEmail: editForm.senderEmail || null,
      previewText: editForm.previewText || null,
      templateId: editForm.templateId || null,
      segmentId: editForm.segmentId || null,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    updateMutation.mutate(result.data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Mail className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load campaign</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const cfg = statusConfig[campaign.status];
  const totalRecipients = campaign.totalRecipients ?? 0;
  const sentCount = campaign.events?.filter((e) => e.eventType === "sent").length ?? 0;
  const openCount = campaign.events?.filter((e) => e.eventType === "opened").length ?? 0;
  const clickCount = campaign.events?.filter((e) => e.eventType === "clicked").length ?? 0;
  const openRate = totalRecipients > 0 ? ((openCount / totalRecipients) * 100).toFixed(1) : "0.0";
  const clickRate = totalRecipients > 0 ? ((clickCount / totalRecipients) * 100).toFixed(1) : "0.0";

  let abTestData = null;
  if (campaign.abTestEnabled && campaign.abTestVariantA && campaign.abTestVariantB) {
    const variantA = JSON.parse(campaign.abTestVariantA) as { subject?: string; content?: string };
    const variantB = JSON.parse(campaign.abTestVariantB) as { subject?: string; content?: string };
    const aSent = campaign.events?.filter((e) => e.eventType === "sent" && e.metadata?.variant === "A").length ?? 0;
    const bSent = campaign.events?.filter((e) => e.eventType === "sent" && e.metadata?.variant === "B").length ?? 0;
    const aOpens = campaign.events?.filter((e) => e.eventType === "opened" && e.metadata?.variant === "A").length ?? 0;
    const bOpens = campaign.events?.filter((e) => e.eventType === "opened" && e.metadata?.variant === "B").length ?? 0;
    const aClicks = campaign.events?.filter((e) => e.eventType === "clicked" && e.metadata?.variant === "A").length ?? 0;
    const bClicks = campaign.events?.filter((e) => e.eventType === "clicked" && e.metadata?.variant === "B").length ?? 0;
    const aOpenRate = aSent > 0 ? ((aOpens / aSent) * 100).toFixed(1) : "0.0";
    const bOpenRate = bSent > 0 ? ((bOpens / bSent) * 100).toFixed(1) : "0.0";
    const pValue = chiSquarePValue(aOpens, aSent - aOpens, bOpens, bSent - bOpens);
    const simpleWinner = parseFloat(aOpenRate) > parseFloat(bOpenRate) ? "A" : parseFloat(bOpenRate) > parseFloat(aOpenRate) ? "B" : null;
    const winner = campaign.abTestWinner || simpleWinner;
    abTestData = {
      variantA, variantB,
      aOpens, bOpens, aClicks, bClicks,
      aSent, bSent,
      aOpenRate, bOpenRate,
      pValue,
      significant: isSignificant(pValue),
      winner,
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{campaign.name}</h1>
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
                {cfg.label}
              </span>
              {campaign.recurringFrequency && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  <Repeat className="h-3 w-3" />
                  {campaign.recurringFrequency}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{campaign.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "DRAFT" && (
            <>
              <button
                onClick={() => sendTestMutation.mutate()}
                disabled={sendTestMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                {sendTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Send Test
              </button>
              <button
                onClick={() => submitForReviewMutation.mutate()}
                disabled={submitForReviewMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                {submitForReviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
                Submit for Review
              </button>
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                <Save className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => { spamCheckMutation.mutate(campaign.content); setShowSpamCheck(true); }}
                disabled={spamCheckMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20 disabled:opacity-50"
              >
                {spamCheckMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                Spam Check
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          {campaign.status === "REVIEW" && (
            <>
              <button
                onClick={() => sendTestMutation.mutate()}
                disabled={sendTestMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                {sendTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Send Test
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                Approve
              </button>
              <button
                onClick={() => requestChangesMutation.mutate()}
                disabled={requestChangesMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20 disabled:opacity-50"
              >
                {requestChangesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Request Changes
              </button>
              <button
                onClick={() => { spamCheckMutation.mutate(campaign.content); setShowSpamCheck(true); }}
                disabled={spamCheckMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20 disabled:opacity-50"
              >
                {spamCheckMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                Spam Check
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          {campaign.status === "APPROVED" && (
            <>
              <button
                onClick={() => sendTestMutation.mutate()}
                disabled={sendTestMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                {sendTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Send Test
              </button>
              <button
                onClick={() => sendCampaignMutation.mutate()}
                disabled={sendCampaignMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                {sendCampaignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Campaign
              </button>
              <button
                onClick={() => { spamCheckMutation.mutate(campaign.content); setShowSpamCheck(true); }}
                disabled={spamCheckMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20 disabled:opacity-50"
              >
                {spamCheckMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                Spam Check
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          {campaign.status === "SCHEDULED" && (
            <>
              <button
                onClick={() => { spamCheckMutation.mutate(campaign.content); setShowSpamCheck(true); }}
                disabled={spamCheckMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20 disabled:opacity-50"
              >
                {spamCheckMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                Spam Check
              </button>
              <button
                onClick={() => cancelScheduleMutation.mutate()}
                disabled={cancelScheduleMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Cancel Schedule
              </button>
              <button onClick={startEditing} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600">
                <Save className="h-4 w-4" />
                Edit
              </button>
            </>
          )}
          {campaign.status === "SENT" && (
            <>
              <button
                onClick={() => router.push(`/dashboard/newsletter/analytics?campaignId=${campaign.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                <BarChart3 className="h-4 w-4" />
                View Stats
              </button>
              <button
                onClick={() => duplicateMutation.mutate()}
                disabled={duplicateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </button>
            </>
          )}
        </div>
      </div>

      {/* Show edit form or view mode */}
      {isEditing ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Basic Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className={cn("w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white", errors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700")}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Subject Line *</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm((p) => ({ ...p, subject: e.target.value }))}
                    className={cn("w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white", errors.subject ? "border-red-400" : "border-zinc-300 dark:border-zinc-700")}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Preview Text</label>
                  <input
                    type="text"
                    value={editForm.previewText}
                    onChange={(e) => setEditForm((p) => ({ ...p, previewText: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Content</h2>
                <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <button
                    onClick={() => setEditorMode("visual")}
                    className={cn("flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors", editorMode === "visual" ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-muted-foreground")}
                  >
                    <Layout className="h-3 w-3" />
                    Visual
                  </button>
                  <button
                    onClick={() => setEditorMode("source")}
                    className={cn("flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors", editorMode === "source" ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-muted-foreground")}
                  >
                    <Code className="h-3 w-3" />
                    Source
                  </button>
                </div>
              </div>
              {editorMode === "visual" ? (
                <EmailEditor
                  value={blocks}
                  onChange={(newBlocks) => {
                    setBlocks(newBlocks);
                    try {
                      const parsed = JSON.parse(newBlocks);
                      const html = buildEmailFromBlocks(parsed);
                      setEditForm((p) => ({ ...p, content: html }));
                    } catch { /* keep existing content */ }
                  }}
                />
              ) : (
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
                  rows={16}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Template</h2>
              <select
                value={editForm.templateId}
                onChange={(e) => setEditForm((p) => ({ ...p, templateId: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">No template</option>
                {(Array.isArray(templates) ? templates : []).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Segment</h2>
              <select
                value={editForm.segmentId}
                onChange={(e) => setEditForm((p) => ({ ...p, segmentId: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">All subscribers</option>
                {(Array.isArray(segments) ? segments : []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {segmentPreview && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <Users className="h-3 w-3" />
                  ~{segmentPreview.count.toLocaleString()} subscribers will receive this campaign
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Campaign Details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Campaign Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Subject</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">{campaign.subject}</p>
                </div>
                {campaign.previewText && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Preview Text</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{campaign.previewText}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Sender</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-white">
                    {campaign.senderName ?? "—"} {campaign.senderEmail ? `<${campaign.senderEmail}>` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Created</p>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                    {new Date(campaign.createdAt).toLocaleString()}
                  </p>
                </div>
                {campaign.scheduledAt && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Scheduled At</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                      {new Date(campaign.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {campaign.submittedForReviewAt && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Submitted for Review</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                      {new Date(campaign.submittedForReviewAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {campaign.approvedAt && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Approved At</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                      {new Date(campaign.approvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {campaign.reviewNotes && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Review Notes</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400 whitespace-pre-wrap">{campaign.reviewNotes}</p>
                  </div>
                )}
                {campaign.sentAt && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Sent At</p>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                      {new Date(campaign.sentAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Template</p>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                    {campaign.template?.name ?? "None"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Segment</p>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                    {campaign.segment?.name ?? "All subscribers"}
                  </p>
                </div>
                {campaign.recurringFrequency && (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Recurring</p>
                      <p className="mt-1 text-sm capitalize text-zinc-900 dark:text-white">
                        {campaign.recurringFrequency}
                        {campaign.recurringFrequency === "weekly" && campaign.recurringDayOfWeek !== null && (
                          <> on {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][campaign.recurringDayOfWeek]}</>
                        )}
                        {campaign.recurringFrequency === "monthly" && campaign.recurringDayOfMonth && (
                          <> on day {campaign.recurringDayOfMonth}</>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Sends So Far</p>
                      <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                        {campaign.recurringCount}
                        {campaign.recurringMaxCount ? ` / ${campaign.recurringMaxCount}` : ""}
                      </p>
                    </div>
                    {campaign.recurringNextRunAt && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Next Run</p>
                        <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                          {new Date(campaign.recurringNextRunAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {campaign.recurringEndsAt && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Ends At</p>
                        <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                          {new Date(campaign.recurringEndsAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
              {campaign.status === "SENT" && (
                <div className="mt-4 flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={campaign.isPublic}
                      onChange={(e) => togglePublicMutation.mutate(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-zinc-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full dark:bg-zinc-600" />
                  </label>
                  <span className="text-sm text-muted-foreground dark:text-zinc-400">
                    {campaign.isPublic ? "Visible in public archive" : "Hidden from public archive"}
                  </span>
                  {campaign.isPublic && (
                    <a
                      href="/newsletter/archive"
                      target="_blank"
                      className="ml-auto text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View Archive →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Performance</h2>
              <div className="space-y-4">
                {[
                  { label: "Sent", value: sentCount },
                  { label: "Opens", value: openCount },
                  { label: "Clicks", value: clickCount },
                  { label: "Open Rate", value: `${openRate}%` },
                  { label: "Click Rate", value: `${clickRate}%` },
                  { label: "Total Recipients", value: totalRecipients },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review Notes */}
          {campaign.status === "REVIEW" && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Review Notes</h2>
              </div>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes or feedback for the campaign creator..."
                rows={4}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white placeholder:text-zinc-400"
              />
            </div>
          )}

          {/* Daily Performance Chart */}
          {dailyData && dailyData.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Daily Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#a1a1aa" tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                    <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "13px" }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={2} fill="rgba(59,130,246,0.1)" name="Opens" />
                    <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} fill="rgba(16,185,129,0.1)" name="Clicks" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Per-Link Click Tracking */}
          {clickStats && clickStats.links.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Per-Link Click Tracking</h3>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                    {clickStats.totalClicks} total clicks
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Link URL</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Clicks</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Unique Clicks</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Last Clicked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clickStats.links.map((link, i) => (
                      <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-3">
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400">
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="max-w-xs truncate">{link.url}</span>
                          </a>
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-zinc-900 dark:text-white">{link.clicks}</td>
                        <td className="px-6 py-3 text-right text-muted-foreground dark:text-zinc-400">{link.uniqueClicks}</td>
                        <td className="px-6 py-3 text-right text-xs text-zinc-400">{new Date(link.lastClicked).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* A/B Testing Results */}
          {abTestData && (
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">A/B Test Results</h3>
                  {abTestData.winner && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Winner: {abTestData.winner}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAbTest(!showAbTest)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {showAbTest ? "Hide" : "Show"}
                </button>
              </div>
              {showAbTest && (
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-2.5 dark:bg-zinc-800/50">
                    <span className="text-xs text-zinc-500">Statistical Significance:</span>
                    <span className={cn("text-xs font-semibold", abTestData.significant ? "text-emerald-600" : "text-amber-600")}>
                      p = {formatPValue(abTestData.pValue)}
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", abTestData.significant ? "bg-badge-success-bg text-badge-success-text" : "bg-badge-warning-bg text-badge-warning-text")}>
                      {abTestData.significant ? "Significant" : "Not Significant"}
                    </span>
                    {campaign.abTestWinnerDeclaredAt && (
                      <span className="ml-auto text-xs text-zinc-400">
                        Declared {new Date(campaign.abTestWinnerDeclaredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className={cn("rounded-xl border p-4", abTestData.winner === "A" ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" : "border-zinc-200 dark:border-zinc-700")}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Variant A</h4>
                        {abTestData.winner === "A" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <p className="mb-1 text-xs text-zinc-500">Subject: <span className="font-medium text-zinc-700 dark:text-muted-foreground">{abTestData.variantA.subject || "—"}</span></p>
                      <p className="mb-3 text-xs text-zinc-500">Recipients: {abTestData.aSent}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">Opens</span>
                          <span className="text-sm font-semibold">{abTestData.aOpens} ({abTestData.aOpenRate}%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">Clicks</span>
                          <span className="text-sm font-semibold">{abTestData.aClicks} ({abTestData.aSent > 0 ? ((abTestData.aClicks / abTestData.aSent) * 100).toFixed(1) : "0.0"}%)</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn("rounded-xl border p-4", abTestData.winner === "B" ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" : "border-zinc-200 dark:border-zinc-700")}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Variant B</h4>
                        {abTestData.winner === "B" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <p className="mb-1 text-xs text-zinc-500">Subject: <span className="font-medium text-zinc-700 dark:text-muted-foreground">{abTestData.variantB.subject || "—"}</span></p>
                      <p className="mb-3 text-xs text-zinc-500">Recipients: {abTestData.bSent}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">Opens</span>
                          <span className="text-sm font-semibold">{abTestData.bOpens} ({abTestData.bOpenRate}%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">Clicks</span>
                          <span className="text-sm font-semibold">{abTestData.bClicks} ({abTestData.bSent > 0 ? ((abTestData.bClicks / abTestData.bSent) * 100).toFixed(1) : "0.0"}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Preview */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Email Preview</h3>
              <div className="flex items-center gap-3">
                {showPreview && (
                  <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <button
                      onClick={() => setPreviewDevice("desktop")}
                      className={cn("rounded-l-lg p-1.5 transition-colors", previewDevice === "desktop" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white" : "text-zinc-400 hover:text-muted-foreground")}
                      title="Desktop"
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("mobile")}
                      className={cn("p-1.5 transition-colors", previewDevice === "mobile" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white" : "text-zinc-400 hover:text-muted-foreground")}
                      title="Mobile"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("gmail")}
                      className={cn("p-1.5 transition-colors", previewDevice === "gmail" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white" : "text-zinc-400 hover:text-muted-foreground")}
                      title="Gmail"
                    >
                      <Globe className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("outlook")}
                      className={cn("p-1.5 transition-colors text-xs font-bold", previewDevice === "outlook" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white" : "text-zinc-400 hover:text-muted-foreground")}
                      title="Outlook"
                    >
                      O
                    </button>
                    <button
                      onClick={() => setPreviewDevice("apple")}
                      className={cn("rounded-r-lg p-1.5 transition-colors text-xs font-bold", previewDevice === "apple" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white" : "text-zinc-400 hover:text-muted-foreground")}
                      title="Apple Mail"
                    >
                      A
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>
            </div>
            {showPreview && (
              <div className="p-6">
                <div className={cn(
                  "rounded-xl border bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800",
                  previewDevice === "mobile" ? "mx-auto w-[375px]" : "",
                  previewDevice === "gmail" ? "border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/20" : "",
                  previewDevice === "outlook" ? "border-purple-200 bg-purple-50/30 dark:border-purple-900 dark:bg-purple-950/20" : "",
                  previewDevice === "apple" ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800" : "",
                )}>
                  {(previewDevice === "gmail" || previewDevice === "outlook" || previewDevice === "apple") && (
                    <div className={cn(
                      "mb-4 rounded-lg px-3 py-1.5 text-center text-xs font-medium",
                      previewDevice === "gmail" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "",
                      previewDevice === "outlook" ? "bg-purple-500/10 text-purple-400" : "",
                      previewDevice === "apple" ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-muted-foreground" : "",
                    )}>
                      {previewDevice === "gmail" ? "📧 Simulated Gmail View — actual rendering may vary" :
                       previewDevice === "outlook" ? "📧 Simulated Outlook View — actual rendering may vary" :
                       "📧 Simulated Apple Mail View — actual rendering may vary"}
                    </div>
                  )}
                  <div className={cn("mx-auto", previewDevice === "mobile" ? "max-w-full" : "max-w-[600px]")}>
                    <div className="rounded-t-lg bg-blue-600 px-6 py-4 text-center text-white">
                      <p className="text-lg font-bold">{campaign.subject}</p>
                      {campaign.previewText && (
                        <p className="mt-1 text-sm text-blue-200">{campaign.previewText}</p>
                      )}
                    </div>
                    <div className="border-x border-b border-zinc-200 p-6 dark:border-zinc-700">
                      {campaign.content ? (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: campaign.content }}
                        />
                      ) : (
                        <p className="text-sm text-zinc-400 text-center py-8">No content</p>
                      )}
                    </div>
                    <div className="rounded-b-lg border-x border-b border-zinc-200 bg-zinc-50 px-6 py-3 text-center text-xs text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <p>Sent by {campaign.senderName || "Newsletter"} &mdash; {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Campaign</h2>
            <p className="mt-2 text-sm text-zinc-500">Are you sure? This action cannot be undone.</p>
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

      {/* Spam Check Modal */}
      {showSpamCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Spam Score Check</h2>
              </div>
              <button
                onClick={() => setShowSpamCheck(false)}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {spamCheckMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Analyzing email content...</p>
              </div>
            ) : spamCheckMutation.data ? (
              <div className="p-6 space-y-6">
                {/* Score Gauge */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Spam Score</span>
                    <span className={cn(
                      "text-2xl font-bold",
                      spamCheckMutation.data.level === "safe" ? "text-emerald-500" :
                      spamCheckMutation.data.level === "moderate" ? "text-amber-500" :
                      "text-red-500"
                    )}>
                      {spamCheckMutation.data.score}/100
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        spamCheckMutation.data.score < 30 ? "bg-emerald-500" :
                        spamCheckMutation.data.score < 60 ? "bg-amber-500" :
                        "bg-red-500"
                      )}
                      style={{ width: `${spamCheckMutation.data.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-zinc-400">
                    <span>Safe (0-29)</span>
                    <span>Moderate (30-59)</span>
                    <span>High (60-100)</span>
                  </div>
                </div>

                {/* Level Badge */}
                <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
                  {spamCheckMutation.data.level === "safe" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : spamCheckMutation.data.level === "moderate" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className={cn(
                      "text-sm font-semibold",
                      spamCheckMutation.data.level === "safe" ? "text-emerald-700 dark:text-emerald-400" :
                      spamCheckMutation.data.level === "moderate" ? "text-amber-700 dark:text-amber-400" :
                      "text-red-700 dark:text-red-400"
                    )}>
                      {spamCheckMutation.data.level === "safe" ? "Safe" :
                       spamCheckMutation.data.level === "moderate" ? "Moderate Risk" : "High Risk"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {spamCheckMutation.data.level === "safe" ? "Your email looks good! Low probability of being marked as spam." :
                       spamCheckMutation.data.level === "moderate" ? "Your email has some spam-like characteristics. Consider reviewing the flagged items." :
                       "Your email has strong spam signals. Review and revise before sending."}
                    </p>
                  </div>
                </div>

                {/* Flags */}
                {spamCheckMutation.data.flags.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                      Flagged Issues ({spamCheckMutation.data.flags.length})
                    </h3>
                    <div className="space-y-2">
                      {spamCheckMutation.data.flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 dark:border-amber-900/40 dark:bg-amber-900/10">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <span className="text-sm text-amber-800 dark:text-amber-300">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-800 dark:text-emerald-300">No spam issues detected!</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSpamCheck(false)}
                    className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Failed to run spam check.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
