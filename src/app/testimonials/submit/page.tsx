"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Star, Send, Loader2, CheckCircle, Upload, X, User, Building2, AtSign, Briefcase, MessageSquareQuote, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { useUploadThing } from "@/lib/uploadthing-client";
import Link from "next/link";

export default function SubmitTestimonialPage() {
  const t = useTranslations("testimonials.submit");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [photo, setPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("publicUploader");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/testimonials/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, jobTitle, photo, rating, content, honeypot }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("failedToSubmit"));
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">{t("thankYou")}</h1>
          <p className="mt-2 text-muted-foreground dark:text-zinc-400">
            {t("submittedMessage")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/testimonials/submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-300 px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">
              <Send className="h-4 w-4" /> {t("submitAnother")}
            </Link>
            <Link href="/testimonials"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
              {t("viewAll")} <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";
  const iconClass = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400";

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 py-20 sm:py-24">
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-brand-500/10">
            <MessageSquareQuote className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">{t("shareYourExperience")}</h1>
          <p className="mt-3 text-lg text-muted-foreground dark:text-zinc-400">
            {t("feedbackHelps")}
          </p>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            {t("reviewNote")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 pb-24 pt-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="hp-field">{t("leaveEmpty")}</label>
            <input id="hp-field" name="website" type="text" tabIndex={-1} autoComplete="off"
              value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("aboutYou")}</h2>

            <div className="relative">
              <User className={iconClass} />
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")} className={inputClass} />
            </div>

            <div className="relative">
              <AtSign className={iconClass} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")} className={inputClass} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="relative">
                <Building2 className={iconClass} />
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                  placeholder={t("companyPlaceholder")} className={inputClass} />
              </div>
              <div className="relative">
                <Briefcase className={iconClass} />
                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={t("positionPlaceholder")} className={inputClass} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">{t("photo")}</label>
              <div className="flex items-center gap-4">
                {photo ? (
                  <div className="relative">
                    <Image src={photo} alt={t("preview")} width={56} height={56} className="rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700" />
                    <button type="button" onClick={() => setPhoto("")}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-400 ring-2 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                    {name ? name.charAt(0).toUpperCase() : t("avatarFallback")}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const res = await startUpload([file]);
                      if (res?.[0]?.url) setPhoto(res[0].url);
                    } catch { setError(t("uploadFailed")); }
                    finally { setUploading(false); }
                  }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-muted-foreground hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? t("uploading") : t("uploadPhoto")}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("yourReview")}</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">{t("rating")}</label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button"
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(i + 1)}
                    className="transition-transform hover:scale-110">
                    <Star className={cn(
                      "h-8 w-8 transition-colors",
                      i < (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground dark:text-muted-foreground"
                    )} />
                  </button>
                ))}
                <span className="ml-2 self-center text-sm text-zinc-500">
                  {["", t("poor"), t("fair"), t("good"), t("great"), t("excellent")][hoverRating || rating]}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">{t("yourTestimonial")}</label>
                <span className={cn(
                  "text-xs tabular-nums",
                  content.length > 900 ? "text-amber-500" : content.length > 0 ? "text-zinc-400" : "text-zinc-400"
                )}>
                  {t("charCount", { count: content.length, max: 1000 })}
                </span>
              </div>
              <textarea required rows={5} maxLength={1000}
                value={content} onChange={(e) => setContent(e.target.value)}
                placeholder={t("testimonialPlaceholder")}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500" />
            </div>
          </div>

          <button type="submit" disabled={submitting || !name || !content}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {submitting ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
