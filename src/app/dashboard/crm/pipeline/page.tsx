"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const STAGES = ["LEAD", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];

const STAGE_COLORS: Record<string, string> = {
  LEAD: "border-t-blue-500",
  QUALIFIED: "border-t-purple-500",
  PROPOSAL_SENT: "border-t-indigo-500",
  NEGOTIATION: "border-t-orange-500",
  WON: "border-t-green-500",
  LOST: "border-t-red-500",
};

const STAGE_HEADER_COLORS: Record<string, string> = {
  LEAD: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  QUALIFIED: "bg-purple-500/10 text-purple-400",
  PROPOSAL_SENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  NEGOTIATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface Deal {
  id: string;
  name: string;
  value: number;
  probability: number;
  stage: string;
  expectedClose: string;
  clientName: string;
  clientId: string;
}

interface PipelineData {
  [stage: string]: Deal[];
}

export default function PipelinePage() {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dragItem = useRef<{ id: string; stage: string } | null>(null);

  const { data: pipeline, isLoading } = useQuery<PipelineData>({
    queryKey: ["crm-pipeline"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/crm/deals?pageSize=500");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const grouped: PipelineData = {};
      STAGES.forEach((s) => { grouped[s] = []; });
      (json.deals as Deal[]).forEach((deal: Deal) => {
        if (grouped[deal.stage]) grouped[deal.stage].push(deal);
      });
      return grouped;
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await fetch(`/api/dashboard/crm/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
      toast("success", "Deal stage updated");
    },
    onError: () => toast("error", "Failed to update deal stage"),
  });

  const handleDragStart = (id: string, stage: string) => {
    dragItem.current = { id, stage };
    setDraggingId(id);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((targetStage: string) => {
    if (!dragItem.current) return;
    if (dragItem.current.stage === targetStage) return;
    updateStageMutation.mutate({ id: dragItem.current.id, stage: targetStage });
    dragItem.current = null;
    setDraggingId(null);
  }, [updateStageMutation]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div key={stage} className="min-w-[280px] flex-1">
            <Skeleton className="mb-3 h-10 w-full rounded-xl" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-500">Drag and drop deals between stages</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
        {STAGES.map((stage) => {
          const deals = pipeline?.[stage] ?? [];
          const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div
              key={stage}
              className={cn(
                "min-w-[280px] flex-1 rounded-xl border-t-4 bg-zinc-50/50 p-4 dark:bg-surface",
                STAGE_COLORS[stage]
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", STAGE_HEADER_COLORS[stage])}>
                    {stage.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-zinc-500">{deals.length}</span>
                </div>
                <span className="text-xs font-medium text-zinc-700 dark:text-muted-foreground">
                  ${totalValue.toLocaleString()}
                </span>
              </div>

              <div className="space-y-3">
                {deals.length === 0 && (
                  <div className="py-8 text-center text-xs text-zinc-400">No deals</div>
                )}
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id, stage)}
                    className={cn(
                      "cursor-grab rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800",
                      draggingId === deal.id && "opacity-50"
                    )}
                  >
                    <a
                      href={`/dashboard/crm/deals/${deal.id}`}
                      className="text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {deal.name}
                    </a>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground dark:text-zinc-400">${deal.value.toLocaleString()}</span>
                      <Badge variant="outline" className="text-xs">{deal.probability}%</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {deal.clientName}
                      {deal.expectedClose && ` \u00B7 ${new Date(deal.expectedClose).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
