"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2, Upload, X, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Turnstile } from "@/components/ui/Turnstile";
import { uploadFiles } from "@/lib/uploadthing-client";
import { useFormFieldOptions } from "@/lib/hooks/useFormFieldOptions";
import { ACCEPTED_FILE_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/contact-schema";

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  projectType: string;
  budget: string;
  timeline: string;
  subject: string;
  message: string;
  honeypot: string;
}

const ACCEPTED_EXTENSIONS = ACCEPTED_FILE_EXTENSIONS.toLowerCase().split(",");

export function ContactForm() {
  const t = useTranslations("contact.form");
  const v = useTranslations("contact.form.validation");
  const { projectTypes, budgetRanges, timelineOptions } = useFormFieldOptions();

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectType: "",
    budget: "",
    timeline: "",
    subject: "",
    message: "",
    honeypot: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "uploading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = v("nameRequired");
    if (!form.email.trim()) {
      newErrors.email = v("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = v("emailInvalid");
    }
    if (!form.projectType) newErrors.projectType = v("projectTypeRequired");
    if (!form.subject.trim()) newErrors.subject = v("subjectRequired");
    if (!form.message.trim()) {
      newErrors.message = v("messageRequired");
    } else if (form.message.trim().length < 10) {
      newErrors.message = v("messageMinLength");
    }

    setErrors(newErrors);
    setSubmitError("");
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const valid = validate();
    if (!valid) {
      setSubmitError(t("requiredFields"));
      return;
    }

    // Honeypot check - silently reject as spam
    if (form.honeypot) return;

    setStatus("uploading");

    let fileUrl = "";
    let fileName = "";

    // Upload file first if one is selected
    if (file) {
      try {
        const [result] = await uploadFiles("attachmentUploader", {
          files: [file],
        });
        fileUrl = result.url;
        fileName = result.name || file.name;
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fileUrl,
          fileName,
          turnstileToken,
        }),
      });

      if (res.ok) {
        setStatus("success");
        setForm({
          name: "",
          email: "",
          phone: "",
          company: "",
          projectType: "",
          budget: "",
          timeline: "",
          subject: "",
          message: "",
          honeypot: "",
        });
        setFile(null);
        setTurnstileToken(null);
        setTimeout(() => setStatus("idle"), 6000);
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [field, msgs] of Object.entries(err.details)) {
            fieldErrors[field] = (msgs as string[])[0];
          }
          setErrors(fieldErrors);
        }
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const fieldClasses = (hasError?: string) =>
    cn(
      "w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
      "dark:text-white dark:placeholder:text-zinc-500",
      hasError
        ? "border-red-500 focus:ring-red-500/50"
        : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
    );

  const selectClasses = (hasError?: string) =>
    cn(
      fieldClasses(hasError),
      "appearance-none cursor-pointer",
      !form.projectType && "text-zinc-400 dark:text-zinc-500"
    );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file size
    if (selected.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, file: t("fileTooLarge", { max: MAX_FILE_SIZE / 1024 / 1024 }) }));
      return;
    }

    // Validate file type (case-insensitive)
    const ext = "." + selected.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setErrors((prev) => ({ ...prev, file: t("invalidFileType") }));
      return;
    }

    setErrors((prev) => {
      const { file: _, ...rest } = prev;
      return rest;
    });
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
  };

  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name & Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            {t("fullName")} <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={fieldClasses(errors.name) + " mt-1.5"}
            placeholder={t("namePlaceholder")}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            {t("email")} <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={fieldClasses(errors.email) + " mt-1.5"}
            placeholder={t("emailPlaceholder")}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      {/* Phone & Company */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>
            {t("phone")}
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={fieldClasses() + " mt-1.5"}
            placeholder={t("phonePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>
            {t("company")}
          </label>
          <input
            id="company"
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className={fieldClasses() + " mt-1.5"}
            placeholder={t("companyPlaceholder")}
          />
        </div>
      </div>

      {/* Project Type */}
      <div>
        <label htmlFor="projectType" className={labelClass}>
          {t("projectType")} <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1.5">
          <select
            id="projectType"
            value={form.projectType}
            onChange={(e) => setForm({ ...form, projectType: e.target.value })}
            className={selectClasses(errors.projectType)}
          >
            <option value="">{t("projectTypePlaceholder")}</option>
            {projectTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {errors.projectType && <p className="mt-1 text-xs text-red-500">{errors.projectType}</p>}
      </div>

      {/* Budget & Timeline */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="budget" className={labelClass}>
            {t("budget")}
          </label>
          <div className="relative mt-1.5">
            <select
              id="budget"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className={cn(fieldClasses(), "appearance-none cursor-pointer", !form.budget && "text-zinc-400 dark:text-zinc-500")}
            >
              <option value="">{t("budgetPlaceholder")}</option>
              {budgetRanges.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="timeline" className={labelClass}>
            {t("timeline")}
          </label>
          <div className="relative mt-1.5">
            <select
              id="timeline"
              value={form.timeline}
              onChange={(e) => setForm({ ...form, timeline: e.target.value })}
              className={cn(fieldClasses(), "appearance-none cursor-pointer", !form.timeline && "text-zinc-400 dark:text-zinc-500")}
            >
              <option value="">{t("timelinePlaceholder")}</option>
              {timelineOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className={labelClass}>
          {t("subject")} <span className="text-red-500">*</span>
        </label>
        <input
          id="subject"
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className={fieldClasses(errors.subject) + " mt-1.5"}
          placeholder={t("subjectPlaceholder")}
        />
        {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelClass}>
          {t("message")} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={fieldClasses(errors.message) + " mt-1.5 resize-none"}
          placeholder={t("messagePlaceholder")}
        />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>

      {/* File Upload */}
      <div>
        <label className={labelClass}>{t("fileUpload")}</label>
        {file ? (
          <div className="mt-1.5 flex items-center justify-between rounded-xl border border-green-300 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-5 transition-all hover:border-blue-500/50 hover:bg-blue-50/50 dark:border-zinc-700 dark:hover:border-blue-400/50 dark:hover:bg-blue-900/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <Upload className="h-5 w-5" />
            </div>
            <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("fileUploadDrag")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {t("fileUploadHint")}
            </p>
            <input
              type="file"
              accept={ACCEPTED_FILE_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
              aria-label={t("fileUpload")}
            />
          </label>
        )}
        {errors.file && <p className="mt-1 text-xs text-red-500">{errors.file}</p>}
      </div>

      {/* Turnstile */}
      <Turnstile onSuccess={setTurnstileToken} />

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="honeypot">{t("leaveEmpty")}</label>
        <input
          id="honeypot"
          type="text"
          value={form.honeypot}
          onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Submit */}
      <div>
        {submitError && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 text-center text-sm text-red-500"
          >
            {submitError}
          </motion.p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === "loading" || status === "uploading"}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {status === "uploading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("uploading")}
            </>
          ) : status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("sending")}
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {t("success")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {t("submit")}
            </>
          )}
        </button>

        <AnimatePresence>
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 text-center text-sm text-red-500"
            >
              {t("error")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
