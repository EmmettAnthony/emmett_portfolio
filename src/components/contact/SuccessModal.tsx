"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle2, X, ArrowRight, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  email?: string;
  name?: string;
  contactId?: string;
}

export function SuccessModal({ open, onClose, email, name, contactId }: SuccessModalProps) {
  const t = useTranslations("contact.successModal");
  const [bookingStep, setBookingStep] = useState(false);
  const [bookStatus, setBookStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bookForm, setBookForm] = useState({ preferredDate: "", preferredTime: "" });

  const handleBook = async () => {
    if (!bookForm.preferredDate || !email) return;
    setBookStatus("loading");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "",
          email,
          preferredDate: bookForm.preferredDate,
          preferredTime: bookForm.preferredTime || null,
          contactId: contactId || null,
          source: "CONTACT_FORM",
        }),
      });
      if (res.ok) {
        setBookStatus("success");
      } else {
        setBookStatus("error");
        setTimeout(() => setBookStatus("idle"), 4000);
      }
    } catch {
      setBookStatus("error");
      setTimeout(() => setBookStatus("idle"), 4000);
    }
  };

  const handleClose = () => {
    setBookingStep(false);
    setBookStatus("idle");
    setBookForm({ preferredDate: "", preferredTime: "" });
    onClose();
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button onClick={handleClose} className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" aria-label={t("close")}>
              <X className="h-5 w-5" />
            </button>

            {!bookingStep ? (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </motion.div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900 dark:text-white">{t("messageSent")}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {t("messageSentDesc")}
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={() => setBookingStep(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                  >
                    <Calendar className="h-4 w-4" />
                    {t("bookConsultation")}
                  </button>
                  <Link href="/portfolio" onClick={handleClose} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                    {t("viewPortfolio")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button onClick={handleClose} className="text-sm font-medium text-muted-foreground transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                    {t("continueBrowsing")}
                  </button>
                </div>
              </div>
            ) : bookStatus === "success" ? (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </motion.div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900 dark:text-white">{t("consultationBooked")}</h3>
                <p className="mt-3 text-sm text-muted-foreground dark:text-zinc-400">
                  {t("consultationBookedDesc")}
                </p>
                <button onClick={handleClose} className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  {t("done")}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("bookHeading")}</h3>
                <p className="mt-1 text-sm text-zinc-500">{t("bookDesc")}</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("preferredDate")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bookForm.preferredDate}
                      onChange={(e) => setBookForm((p) => ({ ...p, preferredDate: e.target.value }))}
                      min={today}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("preferredTime")}</label>
                    <input
                      type="time"
                      value={bookForm.preferredTime}
                      onChange={(e) => setBookForm((p) => ({ ...p, preferredTime: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  {bookStatus === "error" && (
                    <p className="text-xs text-red-500">{t("errorMsg")}</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setBookingStep(false)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                    {t("back")}
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={bookStatus === "loading" || !bookForm.preferredDate}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  >
                    {bookStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {t("bookNow")}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
