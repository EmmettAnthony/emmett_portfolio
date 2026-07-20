"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {Send, Loader2, Mail, CheckCircle2, AlertCircle, Plus, Trash2} from "lucide-react";









import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TestSendDialogProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TestSendDialog({ open, onClose, campaignId, campaignName }: TestSendDialogProps) {
  const { toast } = useToast();
  const [emails, setEmails] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);

  const sendTestMutation = useMutation({
    mutationFn: async (testEmails: string[]) => {
      const res = await fetch("/api/email/campaigns/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, emails: testEmails }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to send test" }));
        throw new Error(err.error || "Failed to send test email");
      }
      return res.json();
    },
    onSuccess: (result) => {
      toast("success", `Test email sent to ${result.sentTo.length} recipient(s)`);
      onClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to send test"),
  });

  const handleAddEmail = () => {
    setEmails((prev) => [...prev, ""]);
    setError(null);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleEmailChange = (index: number, value: string) => {
    setEmails((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError(null);
  };

  const handleSend = () => {
    const valid = emails.filter((e) => EMAIL_REGEX.test(e.trim()));
    const invalid = emails.filter((e) => e.trim() && !EMAIL_REGEX.test(e.trim()));

    if (valid.length === 0) {
      setError("Please enter at least one valid email address");
      return;
    }

    if (invalid.length > 0) {
      setError(`Invalid email(s): ${invalid.join(", ")}`);
      return;
    }

    setError(null);
    sendTestMutation.mutate(valid);
  };

  const handleClose = () => {
    setEmails([""]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-500" />
            Send Test Email
          </DialogTitle>
          <DialogDescription>
            Send a test of <span className="font-medium text-zinc-700 dark:text-zinc-300">&quot;{campaignName}&quot;</span> to preview addresses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Recipients
          </p>

          {emails.map((email, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  autoFocus={index === emails.length - 1}
                />
              </div>
              {emails.length > 1 && (
                <button
                  onClick={() => handleRemoveEmail(index)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-red-100 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {emails.length < 10 && (
            <button
              onClick={handleAddEmail}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another recipient
            </button>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {sendTestMutation.isSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Test email sent successfully!</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Button variant="outline" onClick={handleClose} disabled={sendTestMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendTestMutation.isPending || emails.every((e) => !e.trim())}
            className="gap-2"
          >
            {sendTestMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sendTestMutation.isPending ? "Sending..." : "Send Test"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
