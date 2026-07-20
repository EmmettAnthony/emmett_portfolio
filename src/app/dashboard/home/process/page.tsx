"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus, Edit3, Trash2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function HomeProcessPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-homepage"],
    queryFn: async () => { const res = await fetch("/api/dashboard/home"); if (!res.ok) throw new Error(); return res.json(); },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steps = (data as any)?.homepage?.processSteps ?? [];

   
  const saveMutation = useMutation({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic array type
    mutationFn: async (newSteps: any[]) => {
      const aboutRes = await fetch("/api/dashboard/home");
      const d = await aboutRes.json();
      const h = d.homepage;
      const res = await fetch("/api/dashboard/home", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...h, processSteps: newSteps }) });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dashboard-homepage"] }); toast("success", "Saved"); },
    onError: () => toast("error", "Failed"),
  });

  const addStep = () => {
    const newSteps = [...steps, { step: steps.length + 1, title: "New Step", description: "Description", icon: "arrow-right" }];
    saveMutation.mutate(newSteps);
  };

  const updateStep = (index: number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], title: editTitle, description: editDesc, icon: editIcon };
    saveMutation.mutate(newSteps);
    setEditingIndex(null);
  };

  const deleteStep = (index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newSteps = (steps as any[]).filter((_: any, i: number) => i !== index).map((s: any, i: number) => ({ ...s, step: i + 1 }));
    saveMutation.mutate(newSteps);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditTitle(steps[index].title);
    setEditDesc(steps[index].description);
    setEditIcon(steps[index].icon || "");
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/home"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div><h1 className="text-2xl font-bold">Work Process</h1><p className="mt-1 text-sm text-zinc-500">{steps.length} steps</p></div>
        </div>
        <Button onClick={addStep} disabled={saveMutation.isPending}><Plus className="h-4 w-4" />Add Step</Button>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No steps yet</h3>
          <Button className="mt-6" onClick={addStep}><Plus className="h-4 w-4" />Add Step</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {steps.map((step: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {step.step}
                  </div>
                  {editingIndex === index ? (
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2"><Label>Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Description</Label><Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} /></div>
                      <div className="space-y-2"><Label>Icon</Label><Input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="search, code, rocket" /></div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingIndex(null)} className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700">Cancel</button>
                        <Button size="sm" onClick={() => updateStep(index)} disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-zinc-900 dark:text-white">{step.title}</h3>
                        <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{step.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(index)} className="rounded p-1.5 text-zinc-400 hover:text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteStep(index)} className="rounded p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
