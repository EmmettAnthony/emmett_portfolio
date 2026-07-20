"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save, Loader2, ArrowLeft, Send, Trash2, Clock, CheckCircle, XCircle, Copy,
  Mail, Ban, Calendar, Eye, ChevronDown, List,
  FlaskConical, Split, BarChart3, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RichEmailEditor from "@/components/email/editor/RichEmailEditor";
import TestSendDialog from "@/components/email/TestSendDialog";
import CampaignPreviewModal from "@/components/email/CampaignPreviewModal";

const statusColors: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  SENDING: { label: "Sending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  AWAITING_WINNER: { label: "A/B Testing", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  SENT: { label: "Sent", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  CANCELLED: { label: "Cancelled", color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
};

const STATUS_ICON: Record<string, typeof Send> = {
  DRAFT: Eye, SCHEDULED: Clock, SENDING: Send, AWAITING_WINNER: FlaskConical,
  SENT: CheckCircle, FAILED: XCircle, CANCELLED: Ban,
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["email-campaign", id],
    queryFn: async () => {
      const res = await fetch(`/api/email/campaigns/${id}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
  });

  // ─── Campaign Fields ────────────────────────────────────────────────

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showTestSend, setShowTestSend] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ─── A/B Testing Fields ─────────────────────────────────────────────

  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [subjectB, setSubjectB] = useState("");
  const [contentB, setContentB] = useState("");
  const [abTestPercent, setAbTestPercent] = useState(20);
  const [abTestDuration, setAbTestDuration] = useState(4);
  const [abTestWinnerCriteria, setAbTestWinnerCriteria] = useState<"open" | "click">("open");

  useEffect(() => {
    if (campaign) {
      const timer = setTimeout(() => {
        setName(campaign.name);
        setSubject(campaign.subject);
        setContent(campaign.content || "");
        setScheduledAt(campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : "");
        setShowSchedule(campaign.status === "SCHEDULED");

        // A/B testing
        setAbTestEnabled(campaign.abTestEnabled || false);
        if (campaign.abTestVariantB) {
          try {
            const parsed = typeof campaign.abTestVariantB === "string"
              ? JSON.parse(campaign.abTestVariantB)
              : campaign.abTestVariantB;
            setSubjectB(parsed.subject || "");
            setContentB(parsed.content || "");
          } catch {
            // ignore parse errors
          }
        }
        setAbTestPercent(campaign.abTestTestPercent ?? 20);
        const criteria = (campaign.metadata as Record<string, unknown> | null)?.winnerCriteria;
        if (criteria === "open" || criteria === "click") setAbTestWinnerCriteria(criteria);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [campaign]);

  // ─── Mutations ──────────────────────────────────────────────────────

  const buildUpdatePayload = () => {
    const payload: Record<string, unknown> = { name, subject, htmlContent: content };
    if (abTestEnabled) {
      payload.abTestEnabled = true;
      payload.subjectB = subjectB;
      payload.htmlContentB = contentB;
      payload.abTestTestPercent = abTestPercent;
      payload.abTestWinnerCriteria = abTestWinnerCriteria;
    } else {
      payload.abTestEnabled = false;
    }
    return payload;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/email/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildUpdatePayload()),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaign", id] });
      toast("success", "Campaign saved");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: id,
          ...(abTestEnabled ? { abTestEnabled: true } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast("success", abTestEnabled
        ? "Campaign sent to test group — awaiting winner"
        : "Campaign queued for sending");
    },
    onError: (err) => toast("error", `Failed to send: ${err.message}`),
  });

  const scheduleMutation = useMutation({
    mutationFn: async (sendAt: string) => {
      const res = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          campaignId: id,
          sendAt,
          ...(abTestEnabled ? { abTestEnabled: true } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast("success", "Campaign scheduled");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", campaignId: id }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast("success", "Schedule cancelled");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/email/campaigns/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast("success", "Campaign duplicated");
      router.push(`/dashboard/email/campaigns/${result.id}`);
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/email/campaigns?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast("success", "Campaign deleted");
      router.push("/dashboard/email/campaigns");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  // ─── Helpers ────────────────────────────────────────────────────────

  const handleSchedule = () => {
    if (!scheduledAt) { toast("error", "Please select a date and time"); return; }
    if (abTestEnabled) {
      if (!subjectB.trim()) { toast("error", "Subject B is required for A/B testing"); return; }
      if (!contentB.trim()) { toast("error", "Variant B content is required for A/B testing"); return; }
    }
    scheduleMutation.mutate(new Date(scheduledAt).toISOString());
  };

  const handleSendNow = () => {
    if (abTestEnabled) {
      if (!subjectB.trim()) { toast("error", "Subject B is required for A/B testing"); return; }
      if (!contentB.trim()) { toast("error", "Variant B content is required for A/B testing"); return; }
    }
    sendMutation.mutate();
  };

  // ─── Loading State ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <XCircle className="mb-3 h-12 w-12" />
        <p className="text-lg font-medium text-zinc-500">Campaign not found</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const status = statusColors[campaign.status] || statusColors.DRAFT;
  const StatusIcon = STATUS_ICON[campaign.status] || Eye;
  const isEditable = campaign.status === "DRAFT" || campaign.status === "SCHEDULED";
  const isScheduled = campaign.status === "SCHEDULED";
  const abTestRequiresContentB = abTestEnabled && !contentB.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white truncate max-w-md">
                {campaign.name}
              </h1>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0", status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-lg">
              {campaign.subject}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="gap-1.5">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          {isEditable && (
            <Button variant="outline" size="sm" onClick={() => setShowTestSend(true)} className="gap-1.5">
              <Mail className="h-4 w-4" />
              Test
            </Button>
          )}
          {isEditable && (
            <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          )}

          {/* Draft — Send / Schedule */}
          {isEditable && !isScheduled && (
            <div className="flex items-center gap-1">
              {showSchedule ? (
                <>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white w-44"
                  />
                  <Button size="sm" onClick={handleSchedule} disabled={scheduleMutation.isPending || !scheduledAt} className="gap-1.5">
                    {scheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                    {abTestEnabled ? "A/B Schedule" : "Schedule"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowSchedule(false); handleSendNow(); }} disabled={sendMutation.isPending} className="gap-1.5">
                    {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Now
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={handleSendNow} disabled={sendMutation.isPending} className="gap-1.5">
                    {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {abTestEnabled ? "Send A/B Test" : "Send Now"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSchedule(true)} className="gap-1.5">
                    <Clock className="h-4 w-4" />
                    Schedule
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Scheduled — Cancel */}
          {isScheduled && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setShowTestSend(true)} className="gap-1.5">
                <Mail className="h-4 w-4" /> Test
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
              >
                {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Cancel Schedule
              </Button>
            </div>
          )}

          {/* Sent / Failed / Cancelled — Duplicate */}
          {["SENT", "FAILED", "CANCELLED"].includes(campaign.status) && (
            <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending} className="gap-1.5">
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
          )}

          {/* Overflow menu */}
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowActionsMenu(!showActionsMenu)} className="text-zinc-400">
              <ChevronDown className="h-4 w-4" />
            </Button>
            {showActionsMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  {isEditable && (
                    <button
                      onClick={() => { setShowActionsMenu(false); duplicateMutation.mutate(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Copy className="h-4 w-4" /> Duplicate
                    </button>
                  )}
                  {campaign.status !== "SENT" && (
                    <button
                      onClick={() => { setShowActionsMenu(false); deleteMutation.mutate(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Campaign
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info banners */}
      {isScheduled && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 px-5 py-3 dark:border-blue-800 dark:bg-blue-900/10">
          <Clock className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}
              {campaign.abTestEnabled && " — A/B test enabled"}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400/70">
              The campaign will be sent automatically at this time
            </p>
          </div>
        </div>
      )}

      {campaign.status === "AWAITING_WINNER" && (
        <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50/50 px-5 py-3 dark:border-purple-800 dark:bg-purple-900/10">
          <FlaskConical className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
              A/B Test in Progress — {campaign.abTestTestPercent}% of recipients received test variants
            </p>
            <p className="text-xs text-purple-500 dark:text-purple-400/70">
              Winner will be auto-promoted once the test duration elapses
            </p>
          </div>
        </div>
      )}

      {(campaign.status === "SENT" || campaign.status === "FAILED") && campaign.sentAt && (
        <div className={cn(
          "flex items-center gap-3 rounded-2xl border px-5 py-3",
          campaign.status === "SENT" ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
            : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
        )}>
          {campaign.status === "SENT" ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
          <div>
            <p className={cn("text-sm font-medium", campaign.status === "SENT" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
              {campaign.status === "SENT" ? "Sent" : "Failed"} — {new Date(campaign.sentAt).toLocaleString()}
              {campaign.abTestWinner && ` (Winner: Variant ${campaign.abTestWinner})`}
            </p>
          </div>
        </div>
      )}

      {/* Content Layout */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Send/Schedule info for sent campaigns */}
          {campaign.status === "SENT" && campaign.metadata && typeof campaign.metadata === "object" && "listIds" in (campaign.metadata as Record<string, unknown>) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <List className="h-4 w-4" />
                  Sent to {((campaign.metadata as Record<string, unknown>).listIds as string[] | undefined)?.length ?? 0} target list(s)
                </div>
              </CardContent>
            </Card>
          )}

          {/* A/B Testing Panel */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">A/B Testing</h3>
                </div>
                {isEditable && (
                  <button
                    onClick={() => { setAbTestEnabled(!abTestEnabled); if (!abTestEnabled) setShowSchedule(false); }}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      abTestEnabled ? "bg-purple-500" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                  >
                    <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform", abTestEnabled ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                )}
              </div>

              {abTestEnabled && (
                <div className="space-y-4">
                  {!isEditable && (
                    <div className="rounded-lg bg-purple-50 px-3 py-2 dark:bg-purple-900/20">
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        Variant B will be sent to {abTestPercent}% of recipients
                      </p>
                    </div>
                  )}

                  {/* Subject B */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500">
                      Subject Line B <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subjectB}
                      onChange={(e) => setSubjectB(e.target.value)}
                      placeholder="Alternative subject line..."
                      disabled={!isEditable}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>

                  {/* Split Percentage */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-zinc-500">Test Split</label>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{abTestPercent}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Split className="h-4 w-4 text-zinc-400 shrink-0" />
                      <input
                        type="range"
                        min={10}
                        max={50}
                        step={5}
                        value={abTestPercent}
                        onChange={(e) => setAbTestPercent(Number(e.target.value))}
                        disabled={!isEditable}
                        className="flex-1 h-1.5 rounded-full bg-zinc-200 accent-purple-500 dark:bg-zinc-700"
                      />
                      <span className="text-[10px] text-zinc-400 w-12 text-right">10% – 50%</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {abTestPercent}% of recipients receive both variants; winner goes to remaining {100 - abTestPercent}%
                    </p>
                  </div>

                  {/* Test Duration */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-zinc-500">Test Duration</label>
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{abTestDuration}h</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
                      <input
                        type="range"
                        min={1}
                        max={168}
                        step={1}
                        value={abTestDuration}
                        onChange={(e) => setAbTestDuration(Number(e.target.value))}
                        disabled={!isEditable}
                        className="flex-1 h-1.5 rounded-full bg-zinc-200 accent-purple-500 dark:bg-zinc-700"
                      />
                      <span className="text-[10px] text-zinc-400 w-16 text-right">
                        {abTestDuration < 24 ? `${abTestDuration}h` : `${Math.floor(abTestDuration / 24)}d ${abTestDuration % 24}h`}
                      </span>
                    </div>
                  </div>

                  {/* Winner Criteria */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500">Winner Criteria</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => isEditable && setAbTestWinnerCriteria("open")}
                        disabled={!isEditable}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                          abTestWinnerCriteria === "open"
                            ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                            : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"
                        )}
                      >
                        <BarChart3 className="mx-auto mb-1 h-4 w-4" />
                        Open Rate
                      </button>
                      <button
                        onClick={() => isEditable && setAbTestWinnerCriteria("click")}
                        disabled={!isEditable}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                          abTestWinnerCriteria === "click"
                            ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                            : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"
                        )}
                      >
                        <BarChart3 className="mx-auto mb-1 h-4 w-4" />
                        Click Rate
                      </button>
                    </div>
                  </div>

                  {abTestRequiresContentB && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Variant B needs content below before sending</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Subject & Campaign info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Campaign Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    disabled={!isEditable} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Subject Line A</label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    disabled={!isEditable} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content A */}
          <div>
            <h3 className="mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {abTestEnabled ? "Variant A Content" : "Email Content"}
            </h3>
            {isEditable ? (
              <RichEmailEditor
                value={content}
                onChange={(html) => setContent(html)}
                placeholder="Edit your campaign content..."
              />
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="prose dark:prose-invert max-w-none text-sm text-zinc-600 dark:text-zinc-400"
                  dangerouslySetInnerHTML={{ __html: campaign.content || "<p>No content</p>" }} />
              </div>
            )}
          </div>

          {/* Content B (A/B Testing) */}
          {abTestEnabled && (
            <div>
              <h3 className="mb-2 text-xs font-semibold text-purple-500 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="h-3.5 w-3.5" />
                Variant B Content <span className="text-red-500">*</span>
              </h3>
              {isEditable ? (
                <RichEmailEditor
                  value={contentB}
                  onChange={(html) => setContentB(html)}
                  placeholder="Build variant B of your campaign..."
                />
              ) : (
                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-900/10">
                  <div className="prose dark:prose-invert max-w-none text-sm text-zinc-600 dark:text-zinc-400"
                    dangerouslySetInnerHTML={{ __html: contentB || "<p>No variant B content</p>" }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Test Send Dialog */}
      <TestSendDialog
        open={showTestSend}
        onClose={() => setShowTestSend(false)}
        campaignId={id}
        campaignName={campaign.name}
      />

      {/* Email Preview Modal */}
      <CampaignPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        subject={subject}
        content={content}
        subjectB={subjectB}
        contentB={contentB}
        abTestEnabled={abTestEnabled}
        senderName={campaign.senderName || undefined}
        senderEmail={campaign.senderEmail || undefined}
        previewText={campaign.previewText || undefined}
      />
    </div>
  );
}
