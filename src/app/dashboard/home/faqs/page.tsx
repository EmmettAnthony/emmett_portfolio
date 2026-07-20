"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Plus, Edit3, Trash2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function HomeFaqsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const { data, isLoading } = useQuery<Record<string, unknown>>({
    queryKey: ["dashboard-homepage"],
    queryFn: async () => { const res = await fetch("/api/dashboard/home"); if (!res.ok) throw new Error(); return res.json(); },
  });

  const faqs = ((data?.homepage as Record<string, unknown>)?.faqs as Record<string, unknown>[]) ?? [];

  const saveMutation = useMutation({
    mutationFn: async (newFaqs: Record<string, unknown>[]) => {
      const d = await (await fetch("/api/dashboard/home")).json();
      const h = d.homepage;
      const res = await fetch("/api/dashboard/home", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...h, faqs: newFaqs }) });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dashboard-homepage"] }); toast("success", "Saved"); },
    onError: () => toast("error", "Failed"),
  });

  const addFaq = () => saveMutation.mutate([...faqs, { question: "New Question", answer: "New Answer" }]);
  const updateFaq = (index: number) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { question: editQuestion, answer: editAnswer };
    saveMutation.mutate(newFaqs);
    setEditingIndex(null);
  };
  const deleteFaq = (index: number) => saveMutation.mutate(faqs.filter((_faq: Record<string, unknown>, i: number) => i !== index));
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditQuestion(faqs[index].question);
    setEditAnswer(faqs[index].answer);
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/home"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div><h1 className="text-2xl font-bold">FAQs</h1><p className="mt-1 text-sm text-zinc-500">{faqs.length} total</p></div>
        </div>
        <Button onClick={addFaq} disabled={saveMutation.isPending}><Plus className="h-4 w-4" />Add FAQ</Button>
      </div>

      {faqs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No FAQs yet</h3>
          <Button className="mt-6" onClick={addFaq}><Plus className="h-4 w-4" />Add FAQ</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq: Record<string, unknown>, index: number) => (
            <Card key={index}>
              <CardContent className="p-4">
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <div className="space-y-2"><Label>Question</Label><Input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Answer</Label><Textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} rows={4} /></div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingIndex(null)} className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700">Cancel</button>
                      <Button size="sm" onClick={() => updateFaq(index)} disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-white">{faq.question}</p>
                      <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(index)} className="rounded p-1.5 text-zinc-400 hover:text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteFaq(index)} className="rounded p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
