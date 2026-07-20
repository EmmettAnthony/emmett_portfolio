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

interface AboutData {
  about: {
    id: string;
    faqs: { question: string; answer: string; order: number }[];
  };
}

export default function AboutFaqsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const { data, isLoading, error } = useQuery<AboutData>({
    queryKey: ["dashboard-about"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/about");
      if (!res.ok) throw new Error("Failed to fetch about page");
      return res.json();
    },
  });

  const faqs = data?.about?.faqs ?? [];

  const saveMutation = useMutation({
    mutationFn: async (newFaqs: typeof faqs) => {
      const aboutRes = await fetch("/api/dashboard/about");
      const aboutData = await aboutRes.json();
      const about = aboutData.about;
      const res = await fetch("/api/dashboard/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...about, faqs: newFaqs }),
      });
      if (!res.ok) throw new Error("Failed to save FAQs");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-about"] });
      toast("success", "FAQs saved");
    },
    onError: () => toast("error", "Failed to save FAQs"),
  });

  const addFaq = () => {
    const newFaqs = [...faqs, { question: "New Question", answer: "New Answer", order: faqs.length }];
    saveMutation.mutate(newFaqs);
  };

  const updateFaq = (index: number) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], question: editQuestion, answer: editAnswer };
    saveMutation.mutate(newFaqs);
    setEditingIndex(null);
  };

  const deleteFaq = (index: number) => {
    const newFaqs = faqs.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i }));
    saveMutation.mutate(newFaqs);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditQuestion(faqs[index].question);
    setEditAnswer(faqs[index].answer);
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-32" /></div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <MessageCircle className="mb-3 h-10 w-10 text-red-400" />
      <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load FAQs</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/about"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">FAQs</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{faqs.length} total FAQs</p>
          </div>
        </div>
        <Button onClick={addFaq} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add FAQ
        </Button>
      </div>

      {faqs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No FAQs yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add frequently asked questions about yourself.</p>
          <Button className="mt-6" onClick={addFaq}><Plus className="h-4 w-4" />Add FAQ</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Answer</Label>
                      <Textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} rows={4} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingIndex(null)} className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
                      <Button size="sm" onClick={() => updateFaq(index)} disabled={saveMutation.isPending}>
                        {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-white">{faq.question}</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{faq.answer}</p>
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
