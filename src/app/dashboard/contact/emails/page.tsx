"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Mail, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

interface EmailLog {
  id: string;
  type: string;
  to: string;
  from: string;
  subject: string;
  status: "SUCCESS" | "FAILED";
  error: string | null;
  createdAt: string;
}

interface EmailsData {
  emails: EmailLog[];
}

const statusColors: Record<string, string> = {
  SUCCESS: "text-green-600 dark:text-green-400",
  FAILED: "text-red-600 dark:text-red-400",
};

const statusBg: Record<string, string> = {
  SUCCESS: "bg-green-100 dark:bg-green-900/30",
  FAILED: "bg-red-100 dark:bg-red-900/30",
};

function getTypeLabel(t: ReturnType<typeof useTranslations>, type: string): string {
  switch (type) {
    case "CONTACT_OWNER": return t("contactOwner");
    case "CONTACT_AUTO_REPLY": return t("contactAutoReply");
    case "BOOKING_OWNER": return t("bookingOwner");
    case "BOOKING_AUTO_REPLY": return t("bookingAutoReply");
    default: return type;
  }
}

export default function ContactEmailsPage() {
  const t = useTranslations("dashboard.contactEmails");
  const { data, isLoading, error } = useQuery<EmailsData>({
    queryKey: ["dashboard-contact-emails"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/contact/emails");
      if (!res.ok) throw new Error("Failed to fetch email logs");
      return res.json();
    },
  });

  const emails = data?.emails ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/contact"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {t("emailLog")}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("emailsSent", { count: emails.length })}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            <Mail className="mr-2 inline-block h-4 w-4" />
            {t("sentEmails")}
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <XCircle className="mb-2 h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-red-500">{t("failedToLoadEmails")}</p>
            <p className="text-xs">{t("tryAgainLater")}</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Mail className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium">{t("noEmailsSentYet")}</p>
            <p className="text-xs">{t("noEmailsSentYetDesc")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-3 font-medium text-zinc-500">{t("type")}</th>
                  <th className="px-6 py-3 font-medium text-zinc-500">{t("to")}</th>
                  <th className="px-6 py-3 font-medium text-zinc-500">{t("subject")}</th>
                  <th className="px-6 py-3 font-medium text-zinc-500">{t("status")}</th>
                  <th className="px-6 py-3 font-medium text-zinc-500">{t("date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {emails.map((email) => (
                  <tr
                    key={email.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider dark:bg-zinc-800 dark:text-muted-foreground">
                        {getTypeLabel(t, email.type)}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-zinc-900 dark:text-white">
                      {email.to}
                    </td>
                    <td className="max-w-[300px] truncate px-6 py-4 text-zinc-900 dark:text-white">
                      {email.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          statusBg[email.status],
                          statusColors[email.status]
                        )}
                      >
                        {email.status === "SUCCESS" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {email.status === "SUCCESS" ? t("success") : t("failed")}
                      </span>
                      {email.error && (
                        <p className="mt-1 text-[10px] text-red-500">{email.error}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-500">
                      {new Date(email.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
