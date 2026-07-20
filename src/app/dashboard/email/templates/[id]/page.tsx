"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RichEmailEditor from "@/components/email/editor/RichEmailEditor";
import type { EmailTemplate } from "@/types/email";

const CATEGORIES = [
  { value: "welcome", label: "Welcome" },
  { value: "confirmation", label: "Confirmation" },
  { value: "notification", label: "Notification" },
  { value: "newsletter", label: "Newsletter" },
  { value: "invoice", label: "Invoice" },
  { value: "marketing", label: "Marketing" },
  { value: "booking", label: "Booking" },
  { value: "reminder", label: "Reminder" },
  { value: "custom", label: "Custom" },
];

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: template, isLoading } = useQuery<EmailTemplate>({
    queryKey: ["email-template", id],
    queryFn: async () => {
      const res = await fetch(`/api/email/templates/${id}`);
      if (!res.ok) throw new Error("Failed to fetch template");
      return res.json();
    },
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (template) {
      const timer = setTimeout(() => {
        setName(template.name);
        setDescription(template.description || "");
        setCategory(template.category || "");
        setContent(template.content);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [template]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; category?: string; content: string }) => {
      const res = await fetch(`/api/email/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast("success", "Template updated");
      router.push("/dashboard/email/templates");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/email/templates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast("success", "Template deleted");
      router.push("/dashboard/email/templates");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast("error", "Template name is required");
      return;
    }
    updateMutation.mutate({
      name,
      description: description || undefined,
      category: category || undefined,
      content,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Edit Template</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{template?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
            Delete
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || !name.trim()}>
            {updateMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Template Details + Editor */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Template Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="">No category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          <RichEmailEditor
            value={content}
            onChange={(html) => setContent(html)}
            placeholder="Edit your email template..."
          />
        </div>
      </div>
    </div>
  );
}
