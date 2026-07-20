"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Loader2, ArrowLeft, Sparkles, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import RichEmailEditor from "@/components/email/editor/RichEmailEditor";
import { TEMPLATE_CATEGORIES, PREBUILT_TEMPLATES } from "@/lib/email/templates/prebuilt";
import type { EmailTemplate } from "@/types/email";

const CATEGORIES = [
  { value: "", label: "No category" },
  ...TEMPLATE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

export default function NewTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [showPrebuilt, setShowPrebuilt] = useState(true);
  const [prebuiltSearch, setPrebuiltSearch] = useState("");

  // Fetch existing pre-built templates from DB (in case they've been seeded)
  const { data: existingTemplates } = useQuery<EmailTemplate[]>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/email/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; category?: string; content: string }) => {
      const res = await fetch("/api/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      toast("success", "Template created");
      router.push("/dashboard/email/templates");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast("error", "Template name is required");
      return;
    }
    createMutation.mutate({
      name,
      description: description || undefined,
      category: category || undefined,
      content,
    });
  };

  const applyPrebuilt = (tmpl: typeof PREBUILT_TEMPLATES[0]) => {
    setName(`${tmpl.name} (Copy)`);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setContent(tmpl.content);
    setShowPrebuilt(false);
    toast("success", `Loaded "${tmpl.name}" template — customize it freely`);
  };

  const applyExistingBuiltIn = (tmpl: EmailTemplate) => {
    setName(`${tmpl.name} (Copy)`);
    setDescription(tmpl.description || "");
    setCategory(tmpl.category || "");
    setContent(tmpl.content);
    setShowPrebuilt(false);
    toast("success", `Loaded "${tmpl.name}" template — customize it freely`);
  };

  const filteredPrebuilt = PREBUILT_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(prebuiltSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(prebuiltSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(prebuiltSearch.toLowerCase())
  );

  const existingBuiltIns = existingTemplates?.filter((t) => t.isBuiltIn) || [];

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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create Template</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Build a reusable email template with the drag-and-drop editor
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={createMutation.isPending || !name.trim()}>
          {createMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Save Template
        </Button>
      </div>

      {/* Pre-built Template Picker */}
      {showPrebuilt && (
        <Card className="border-brand-200 dark:border-brand-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Start from a pre-built template
                </h2>
              </div>
              <button
                onClick={() => setShowPrebuilt(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Skip — start blank
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={prebuiltSearch}
                onChange={(e) => setPrebuiltSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            {/* Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPrebuilt.map((tmpl) => {
                const catInfo = TEMPLATE_CATEGORIES.find((c) => c.value === tmpl.category);
                const existsInDb = existingBuiltIns.find((t) => t.name === tmpl.name);
                return (
                  <button
                    key={tmpl.name}
                    onClick={() => existsInDb ? applyExistingBuiltIn(existsInDb) : applyPrebuilt(tmpl)}
                    className="group relative flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all hover:border-brand-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-brand-700"
                  >
                    <div className={cn(
                      "rounded-lg p-2",
                      catInfo?.color?.split(" ")[0] || "bg-zinc-100 dark:bg-zinc-800"
                    )}>
                      <FileText className={cn(
                        "h-4 w-4",
                        catInfo?.color?.split(" ")[1] || "text-zinc-600 dark:text-zinc-400"
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {tmpl.name}
                      </p>
                      {catInfo && (
                        <span className={cn(
                          "mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium",
                          catInfo.color
                        )}>
                          {catInfo.label}
                        </span>
                      )}
                      {tmpl.description && (
                        <p className="mt-1.5 text-[11px] text-zinc-500 line-clamp-2">{tmpl.description}</p>
                      )}
                    </div>
                    <span className="absolute right-3 top-3 rounded-full bg-brand-100 px-2 py-0.5 text-[9px] font-medium text-brand-700 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-brand-900/30 dark:text-brand-400">
                      Use
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder="e.g., Welcome Email"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this template for?"
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
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              {name && !showPrebuilt && (
                <button
                  onClick={() => {
                    setShowPrebuilt(true);
                    setContent("");
                    setName("");
                    setDescription("");
                    setCategory("");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Start over from a pre-built template
                </button>
              )}
            </CardContent>
          </Card>

          {/* Variables Reference */}
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-xs font-semibold text-zinc-900 dark:text-white">Available Variables</h3>
              <div className="space-y-1">
                {[
                  { var: "{{first_name}}", desc: "Recipient's first name" },
                  { var: "{{last_name}}", desc: "Recipient's last name" },
                  { var: "{{full_name}}", desc: "Full name" },
                  { var: "{{email}}", desc: "Email address" },
                  { var: "{{company}}", desc: "Company name" },
                  { var: "{{booking_date}}", desc: "Booking date" },
                  { var: "{{amount}}", desc: "Payment amount" },
                  { var: "{{unsubscribe_url}}", desc: "Unsubscribe link" },
                ].map((v) => (
                  <div key={v.var} className="flex items-center gap-2 rounded-md bg-zinc-50 px-2 py-1 dark:bg-zinc-800">
                    <code className="text-[10px] font-mono text-brand-600 dark:text-brand-400">{v.var}</code>
                    <span className="text-[9px] text-zinc-400">{v.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          <RichEmailEditor
            value={content}
            onChange={(html) => setContent(html)}
            placeholder="Build your email template using the toolbar above"
          />
        </div>
      </div>
    </div>
  );
}
