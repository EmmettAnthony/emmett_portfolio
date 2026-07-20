"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Plus, X, Edit3, Trash2, Loader2, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
}

interface FaqForm {
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
}

const defaultForm: FaqForm = { question: "", answer: "", category: "", order: 0, active: true };

export default function FaqsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState<FaqForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FaqForm, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["support-faqs"],
    queryFn: async () => {
      const res = await fetch("/api/support/faqs");
      if (!res.ok) throw new Error("Failed to fetch FAQs");
      return res.json() as Promise<{ faqs: Faq[] }>;
    },
  });

  const faqs = data?.faqs ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<FaqForm>) => {
      const res = await fetch("/api/support/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-faqs"] });
      toast("success", "FAQ created");
      closeModal();
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: payload }: { id: string; data: Partial<FaqForm> }) => {
      const res = await fetch(`/api/support/faqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-faqs"] });
      toast("success", "FAQ updated");
      closeModal();
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/support/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to delete"); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-faqs"] });
      toast("success", "FAQ deleted");
      setDeleteId(null);
      setDeleteError("");
    },
    onError: (err: Error) => { setDeleteError(err.message); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/support/faqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-faqs"] });
    },
    onError: () => toast("error", "Failed to update FAQ"),
  });

  const updateField = (key: keyof FaqForm, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(faq: Faq) {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, order: faq.order, active: faq.active });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
  }

  function handleSubmit() {
    const errors: Partial<Record<keyof FaqForm, string>> = {};
    if (!form.question.trim()) errors.question = "Question is required";
    if (!form.answer.trim()) errors.answer = "Answer is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Partial<FaqForm> = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category.trim() || undefined,
      order: form.order,
      active: form.active,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <HelpCircle className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load FAQs</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">FAQs</h2>
          <p className="text-sm text-zinc-500">{faqs.length} total FAQs</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No FAQs yet. Create your first one!</p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="h-4 w-4" />
              Add FAQ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Question</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {faqs.map((faq) => (
                  <tr key={faq.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate max-w-[300px]">{faq.question}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{faq.category || "—"}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{faq.order}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: faq.id, active: !faq.active })}
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          faq.active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        {faq.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(faq)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteId(faq.id); setDeleteError(""); }} className="hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editing ? "Edit FAQ" : "Add FAQ"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Question *</label>
                <Input
                  value={form.question}
                  onChange={(e) => updateField("question", e.target.value)}
                  className={cn(formErrors.question && "border-red-400")}
                  placeholder="e.g. How do I reset my password?"
                />
                {formErrors.question && <p className="mt-1 text-xs text-red-500">{formErrors.question}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Answer *</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => updateField("answer", e.target.value)}
                  rows={5}
                  className={cn(
                    "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                    formErrors.answer && "border-red-400"
                  )}
                />
                {formErrors.answer && <p className="mt-1 text-xs text-red-500">{formErrors.answer}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Category</label>
                  <Input value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="General" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Order</label>
                  <Input type="number" min={0} value={form.order} onChange={(e) => updateField("order", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Active</label>
                  <button
                    onClick={() => updateField("active", !form.active)}
                    className={cn(
                      "mt-1 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      form.active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {form.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setDeleteId(null); setDeleteError(""); }}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete FAQ</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </p>
            {deleteError && <p className="mt-2 text-sm text-red-500">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteId(null); setDeleteError(""); }}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
