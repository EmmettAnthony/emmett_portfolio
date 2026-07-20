"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  ArrowLeft,
  Save,
  Clock,
  Users,
  User,
  FlaskConical,
  Split,
  BarChart3,
  AlertTriangle,
  Mail,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import RichEmailEditor from "@/components/email/editor/RichEmailEditor";
import TestSendDialog from "@/components/email/TestSendDialog";
import CampaignPreviewModal from "@/components/email/CampaignPreviewModal";

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [content, setContent] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [showTestSend, setShowTestSend] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // A/B Testing
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [subjectB, setSubjectB] = useState("");
  const [contentB, setContentB] = useState("");
  const [abTestPercent, setAbTestPercent] = useState(20);
  const [abTestDuration, setAbTestDuration] = useState(4);
  const [abTestWinnerCriteria, setAbTestWinnerCriteria] = useState<"open" | "click">("open");

  const { data: lists } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: async () => {
      const res = await fetch("/api/email/contact-lists");
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create" }));
        throw new Error(err.error || "Failed to create campaign");
      }
      return res.json();
    },
    onSuccess: (result) => {
      router.push(`/dashboard/email/campaigns/${result.id}`);
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const buildPayload = (action?: string) => {
    const payload: Record<string, unknown> = {
      name,
      subject,
      senderName: senderName || undefined,
      senderEmail: senderEmail || undefined,
      htmlContent: content,
      scheduledAt: showSchedule && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      listIds: selectedListIds,
    };
    if (action) payload.action = action;
    if (abTestEnabled) {
      payload.abTestEnabled = true;
      payload.subjectB = subjectB;
      payload.htmlContentB = contentB;
      payload.abTestTestPercent = abTestPercent;
      payload.abTestWinnerCriteria = abTestWinnerCriteria;
    }
    return payload;
  };

  const handleSave = () => {
    if (!name.trim()) { toast("error", "Campaign name is required"); return; }
    if (!subject.trim()) { toast("error", "Subject line is required"); return; }
    if (selectedListIds.length === 0) { toast("error", "Select at least one target list"); return; }
    if (abTestEnabled && !subjectB.trim()) { toast("error", "Subject B is required for A/B testing"); return; }
    if (abTestEnabled && !contentB.trim()) { toast("error", "Variant B content is required for A/B testing"); return; }

    createMutation.mutate(buildPayload());
  };

  const handleSaveAndSend = () => {
    if (!name.trim()) { toast("error", "Campaign name is required"); return; }
    if (!subject.trim()) { toast("error", "Subject line is required"); return; }
    if (selectedListIds.length === 0) { toast("error", "Select at least one target list"); return; }
    if (abTestEnabled && !subjectB.trim()) { toast("error", "Subject B is required for A/B testing"); return; }
    if (abTestEnabled && !contentB.trim()) { toast("error", "Variant B content is required for A/B testing"); return; }

    createMutation.mutate(buildPayload("send"));
  };

  const toggleList = (id: string) => {
    setSelectedListIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const canSave = name.trim() && subject.trim() && selectedListIds.length > 0;
  const isScheduled = showSchedule && scheduledAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">New Campaign</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create an email campaign with the drag-and-drop editor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="gap-1.5">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTestSend(true)} className="gap-1.5">
            <Mail className="h-4 w-4" />
            Test
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={createMutation.isPending || !canSave}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save Draft
          </Button>
          <Button
            onClick={handleSaveAndSend}
            disabled={createMutation.isPending || !canSave}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            {isScheduled ? "Schedule" : "Save & Send"}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Campaign Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., March Newsletter"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., This month's top stories"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sender Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-400" />
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">Sender</h3>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">From Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Emmett Anthony"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">From Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="hello@emmettanthony.dev"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Target Lists */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Target Lists <span className="text-red-500">*</span>
                </h3>
                <span className="ml-auto text-[10px] text-zinc-400">
                  {selectedListIds.length} selected
                </span>
              </div>
              {lists && lists.length > 0 ? (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {lists.map((list: { id: string; name: string; _count?: { members: number } }) => (
                    <label
                      key={list.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                        selectedListIds.includes(list.id)
                          ? "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedListIds.includes(list.id)}
                        onChange={() => toggleList(list.id)}
                        className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-700 truncate dark:text-zinc-300">
                          {list.name}
                        </p>
                        {list._count && (
                          <p className="text-[10px] text-zinc-400">
                            {list._count.members} contacts
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">No contact lists available</p>
              )}
            </CardContent>
          </Card>

          {/* A/B Testing */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">A/B Testing</h3>
                </div>
                <button
                  onClick={() => { setAbTestEnabled(!abTestEnabled); }}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    abTestEnabled ? "bg-purple-500" : "bg-zinc-300 dark:bg-zinc-700"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                    abTestEnabled ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {abTestEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500">
                      Subject Line B <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subjectB}
                      onChange={(e) => setSubjectB(e.target.value)}
                      placeholder="Alternative subject line..."
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
                        className="flex-1 h-1.5 rounded-full bg-zinc-200 accent-purple-500 dark:bg-zinc-700"
                      />
                      <span className="text-[10px] text-zinc-400 w-12 text-right">10% – 50%</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {abTestPercent}% get both variants; winner goes to remaining {100 - abTestPercent}%
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
                        onClick={() => setAbTestWinnerCriteria("open")}
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
                        onClick={() => setAbTestWinnerCriteria("click")}
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

                  {abTestEnabled && !contentB.trim() && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Variant B needs content below before saving</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">Schedule</h3>
                </div>
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    showSchedule ? "bg-brand-500" : "bg-zinc-300 dark:bg-zinc-700"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                    showSchedule ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
              {showSchedule && (
                <div className="space-y-2">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Campaign will be sent automatically at the scheduled time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email Editor */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <h3 className="mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {abTestEnabled ? "Variant A Content" : "Email Content"}
            </h3>
            <RichEmailEditor
              value={content}
              onChange={(html) => setContent(html)}
              placeholder="Build your campaign email using the drag-and-drop editor..."
            />
          </div>

          {/* Variant B Content (A/B Testing) */}
          {abTestEnabled && (
            <div>
              <h3 className="mb-2 text-xs font-semibold text-purple-500 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="h-3.5 w-3.5" />
                Variant B Content <span className="text-red-500">*</span>
              </h3>
              <RichEmailEditor
                value={contentB}
                onChange={(html) => setContentB(html)}
                placeholder="Build variant B of your campaign..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Test Send Dialog */}
      <TestSendDialog
        open={showTestSend}
        onClose={() => setShowTestSend(false)}
        campaignId=""
        campaignName={name || "New Campaign"}
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
        senderName={senderName || undefined}
        senderEmail={senderEmail || undefined}
      />
    </div>
  );
}
