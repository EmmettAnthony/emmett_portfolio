"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, X, Trash2, Edit3, MessageCircle, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { ServiceFAQ } from "@/types/services";

interface FaqsResponse {
  faqs: (ServiceFAQ & { service?: { id: string; title: string } | null })[];
}

export default function GlobalFaqsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editFaq, setEditFaq] = useState<ServiceFAQ | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", order: 0 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery<FaqsResponse>({
    queryKey: ["dashboard-global-faqs"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/services/faqs");
      if (!res.ok) throw new Error("Failed to fetch FAQs");
      return res.json();
    },
  });

  const faqs = data?.faqs?.filter((f) => !f.serviceId) ?? [];

  const createMutation = useMutation({
    mutationFn: async (data: { question: string; answer: string; order: number }) => {
      const res = await fetch("/api/dashboard/services/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, serviceId: null }),
      });
      if (!res.ok) throw new Error("Failed to create FAQ");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-global-faqs"] });
      toast("success", "FAQ created");
      setShowAdd(false);
      setForm({ question: "", answer: "", order: 0 });
    },
    onError: () => toast("error", "Failed to create FAQ"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await fetch(`/api/dashboard/services/faqs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update FAQ");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-global-faqs"] });
      toast("success", "FAQ updated");
      setEditFaq(null);
      setForm({ question: "", answer: "", order: 0 });
    },
    onError: () => toast("error", "Failed to update FAQ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/services/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete FAQ");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-global-faqs"] });
      toast("success", "FAQ deleted");
    },
    onError: () => toast("error", "Failed to delete FAQ"),
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.question.trim()) errors.question = "Question is required";
    if (!form.answer.trim()) errors.answer = "Answer is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    createMutation.mutate(form);
  };

  const handleUpdate = () => {
    if (!editFaq || !validate()) return;
    updateMutation.mutate({ id: editFaq.id, data: form });
  };

  const startEdit = (faq: ServiceFAQ) => {
    setEditFaq(faq);
    setForm({ question: faq.question, answer: faq.answer, order: faq.order });
    setFormErrors({});
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <MessageCircle className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load FAQs</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Global FAQs</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{faqs.length} FAQs shown on all service pages</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd(true); setForm({ question: "", answer: "", order: faqs.length }); setFormErrors({}); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add FAQ
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : faqs.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <MessageCircle className="h-8 w-8 text-zinc-300 dark:text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">No global FAQs yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">FAQs here appear on all service pages.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {faq.question}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400 line-clamp-2 pl-8">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(faq)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(faq.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add FAQ Modal */}
      {(showAdd || editFaq) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editFaq ? "Edit FAQ" : "Add Global FAQ"}
              </h2>
              <button
                onClick={() => { setShowAdd(false); setEditFaq(null); setFormErrors({}); }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    formErrors.question ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="How long does a project take?"
                />
                {formErrors.question && <p className="mt-1 text-xs text-red-500">{formErrors.question}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                  rows={5}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    formErrors.answer ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="Projects typically take 2-6 weeks depending on scope..."
                />
                {formErrors.answer && <p className="mt-1 text-xs text-red-500">{formErrors.answer}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Order</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                    className="w-24 rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, order: Math.max(0, p.order - 1) }))}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, order: p.order + 1 }))}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowAdd(false); setEditFaq(null); setFormErrors({}); }}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={editFaq ? handleUpdate : handleCreate}
                disabled={(editFaq ? updateMutation : createMutation).isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                {(editFaq ? updateMutation : createMutation).isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {editFaq ? "Update" : "Add FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
