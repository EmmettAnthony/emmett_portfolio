"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useTranslations } from "@/lib/i18n";

export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const t = useTranslations("resume");

  const handleShare = async () => {
    const url = `${window.location.origin}/resume`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("success", t("linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast("success", t("linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button variant="outline" onClick={handleShare} className={className}>
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? t("copied") : t("share")}
    </Button>
  );
}
