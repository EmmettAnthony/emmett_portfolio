"use client";

import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, User, Mail, Phone, Building2 } from "lucide-react";
import { ChatContext } from "./ChatProvider";
import { useTranslations } from "next-intl";

interface ChatContactFormProps {
  conversationId?: string | null;
  sendMessage?: (content: string) => Promise<void>;
  setShowContactForm?: (show: boolean) => void;
}

export function ChatContactForm(props?: ChatContactFormProps) {
  const t = useTranslations("chat");
  const ctx = useContext(ChatContext);
  const conversationId = props?.conversationId ?? ctx?.conversationId ?? null;

  const setShowContactForm = props?.setShowContactForm ?? ctx?.setShowContactForm ?? (() => {});
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !conversationId) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/chat/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          company: form.company || null,
          requirements: `Contact form submission from ${form.name}`,
        }),
      });

      if (res.ok) {
        setShowContactForm(false);
      }
    } catch {
      // Fallback — silent, as the form is a convenience feature
      setShowContactForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
    >
      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
        {t("contactForm.title")}
      </h4>
      <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
        {t("contactForm.description")}
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 dark:border-blue-800 dark:bg-zinc-800">
          <User className="h-4 w-4 text-blue-500" />
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("contactForm.name")}
            required
            className="flex-1 bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 dark:border-blue-800 dark:bg-zinc-800">
          <Mail className="h-4 w-4 text-blue-500" />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t("contactForm.email")}
            required
            className="flex-1 bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 dark:border-blue-800 dark:bg-zinc-800">
          <Phone className="h-4 w-4 text-blue-500" />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={t("contactForm.phone")}
            className="flex-1 bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 dark:border-blue-800 dark:bg-zinc-800">
          <Building2 className="h-4 w-4 text-blue-500" />
          <input
            type="text"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder={t("contactForm.company")}
            className="flex-1 bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          {t("contactForm.submit")}
        </button>
      </form>
    </motion.div>
  );
}
