"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Loader2
} from "lucide-react";

export default function SeoPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    siteName: "", tagline: "", description: "", keywords: "",
    ogImage: "", favicon: "", googleVerification: "", metaSuffix: "",
  });
  const [saved, setSaved] = useState(false);

  const { data: seo, isLoading } = useQuery({
    queryKey: ["seo"],
    queryFn: async () => {
      const res = await fetch("/api/admin/seo");
      return res.json();
    },
  });

  const initForm = useCallback(() => {
    if (seo?.id) {
      const keywords = seo.keywords
        ? JSON.parse(seo.keywords).join("\n")
        : "";
      setForm({
        siteName: seo.siteName ?? "",
        tagline: seo.tagline ?? "",
        description: seo.description ?? "",
        keywords,
        ogImage: seo.ogImage ?? "",
        favicon: seo.favicon ?? "",
        googleVerification: seo.googleVerification ?? "",
        metaSuffix: seo.metaSuffix ?? "",
      });
    }
  }, [seo]);

  useEffect(() => { const t = setTimeout(initForm, 0); return () => clearTimeout(t); }, [initForm]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">SEO Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">Manage search engine optimization</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Global SEO</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Site Name</label>
              <input type="text" value={form.siteName} onChange={(e) => updateField("siteName", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Tagline</label>
              <input type="text" value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Keywords (one per line)</label>
            <textarea value={form.keywords} onChange={(e) => updateField("keywords", e.target.value)} rows={4} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Meta & Verification</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">OG Image URL</label>
              <input type="url" value={form.ogImage} onChange={(e) => updateField("ogImage", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Favicon URL</label>
              <input type="url" value={form.favicon} onChange={(e) => updateField("favicon", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Google Verification Code</label>
              <input type="text" value={form.googleVerification} onChange={(e) => updateField("googleVerification", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Meta Title Suffix</label>
              <input type="text" value={form.metaSuffix} onChange={(e) => updateField("metaSuffix", e.target.value)} placeholder="| Emmett Anthony" className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved successfully!</span>}
          <button type="submit" disabled={mutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save SEO</>}
          </button>
        </div>
      </form>
    </div>
  );
}
