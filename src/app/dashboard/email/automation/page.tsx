"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap,
  Play,
  Pause,
  Trash2,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  steps?: { id: string; name: string; stepOrder: number }[];
}

const triggerLabels: Record<string, string> = {
  welcome_series: "Welcome Series",
  blog_notification: "Blog Notification",
  lead_nurturing: "Lead Nurturing",
  re_engagement: "Re-engagement",
  tag_added: "Tag Added",
  custom: "Custom",
};

export default function AutomationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: automations, isLoading } = useQuery<AutomationWorkflow[]>({
    queryKey: ["email-automations"],
    queryFn: async () => {
      const res = await fetch("/api/email/automations");
      if (!res.ok) throw new Error("Failed to fetch automations");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/email/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update automation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-automations"] });
      toast("success", "Automation updated");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email/automations?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete automation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-automations"] });
      toast("success", "Automation deleted");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Email Automation</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Automate email sequences based on triggers
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-2" />
              <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
            </div>
          ))}
        </div>
      ) : automations && automations.length > 0 ? (
        <div className="space-y-3">
          {automations.map((auto) => (
            <Card key={auto.id}>
              <CardContent className="flex items-start justify-between p-5">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "rounded-lg p-2.5",
                    auto.status === "ACTIVE" ? "bg-emerald-100 dark:bg-emerald-900/30" :
                    auto.status === "PAUSED" ? "bg-amber-100 dark:bg-amber-900/30" :
                    "bg-zinc-100 dark:bg-zinc-800"
                  )}>
                    <Zap className={cn(
                      "h-5 w-5",
                      auto.status === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400" :
                      auto.status === "PAUSED" ? "text-amber-600 dark:text-amber-400" :
                      "text-zinc-400"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{auto.name}</h3>
                    {auto.description && (
                      <p className="mt-0.5 text-sm text-zinc-500">{auto.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {triggerLabels[auto.triggerType] || auto.triggerType}
                      </span>
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        auto.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        auto.status === "PAUSED" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      )}>
                        {auto.status}
                      </span>
                      {auto.steps && (
                        <span className="text-[10px] text-zinc-400">
                          {auto.steps.length} step{auto.steps.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMutation.mutate({
                      id: auto.id,
                      status: auto.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                    })}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                    title={auto.status === "ACTIVE" ? "Pause" : "Activate"}
                  >
                    {auto.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(auto.id)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Workflow className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium text-zinc-500">No automations yet</p>
          <p className="mt-1 text-sm">Create automated email sequences from the Newsletter Automation page.</p>
          <Button className="mt-4" variant="outline" onClick={() => window.open("/dashboard/newsletter/automation", "_self")}>
            Go to Newsletter Automation
          </Button>
        </div>
      )}
    </div>
  );
}
