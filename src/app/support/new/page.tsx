"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTicketSchema, type CreateTicketInput } from "@/lib/validations/support";
import { Loader2, Send, ArrowLeft, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { UploadButton } from "@/lib/uploadthing-client";
import { Turnstile } from "@/components/ui/Turnstile";

interface Attachment {
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  storageKey: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [priorities, setPriorities] = useState<{ id: string; name: string; slug: string; level: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      fullName: "",
      email: "",
      subject: "",
      description: "",
      preferredContact: "email",
    },
  });

  useEffect(() => {
    fetch("/api/support/categories").then(r => r.json()).then(data => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
    fetch("/api/support/priorities").then(r => r.json()).then(data => setPriorities(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  async function onSubmit(data: CreateTicketInput) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          attachments: attachments.length > 0 ? attachments : undefined,
          turnstileToken,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create ticket");
      router.push(`/support/ticket/${result.ticket.ticketNumber}`);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Catch clause error type
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/support" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">Submit a Support Ticket</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        We&apos;ll get back to you as soon as possible.
      </p>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Name *</label>
            <input {...form.register("fullName")} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            {form.formState.errors.fullName && <p className="mt-1 text-xs text-red-500">{form.formState.errors.fullName.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email *</label>
            <input {...form.register("email")} type="email" className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            {form.formState.errors.email && <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone</label>
            <input {...form.register("phone")} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company</label>
            <input {...form.register("company")} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Subject *</label>
          <input {...form.register("subject")} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          {form.formState.errors.subject && <p className="mt-1 text-xs text-red-500">{form.formState.errors.subject.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
            <select {...form.register("categoryId")} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
            <select {...form.register("priorityId")} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
              <option value="">Select priority</option>
              {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Preferred Contact Method</label>
          <select {...form.register("preferredContact")} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="any">Any</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Message *</label>
          <textarea {...form.register("description")} rows={6} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          {form.formState.errors.description && <p className="mt-1 text-xs text-red-500">{form.formState.errors.description.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Attachments</label>
          <UploadButton
            endpoint="supportAttachmentUploader"
            onClientUploadComplete={(res) => {
              if (res) {
                setAttachments(prev => [...prev, ...res.map(f => ({
                  fileName: f.name,
                  fileSize: f.size,
                  mimeType: f.type,
                  url: f.ufsUrl || f.url,
                  storageKey: f.key,
                }))]);
              }
            }}
          />
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((file, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-700 dark:text-zinc-300">{file.fileName}</span>
                  <span className="text-xs text-zinc-400">({(file.fileSize / 1024).toFixed(0)} KB)</span>
                </div>
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <Turnstile onSuccess={setTurnstileToken} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
}
