"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, FileDown } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

interface DownloadButtonProps {
  template: string;
  label: string;
  variant?: "default" | "outline";
  className?: string;
  mode?: "print" | "pdf";
}

export function DownloadButton({ template, label, variant = "default", className, mode = "print" }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("resume");

  const handleDownload = async () => {
    setLoading(true);
    try {
      await fetch("/api/dashboard/resume/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      }).catch(() => {});

      if (mode === "pdf") {
        const response = await fetch(`/api/resume/pdf?template=${template}`);
        if (!response.ok) throw new Error("PDF generation failed");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const disposition = response.headers.get("Content-Disposition") || "";
        const match = disposition.match(/filename="(.+)"/);
        a.download = match ? match[1] : `Resume-${template}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const printWindow = window.open(`/resume/print?template=${template}`, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        } else {
          window.location.href = `/resume/print?template=${template}`;
        }
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handleDownload} disabled={loading} className={className}>
      {mode === "pdf" ? <FileDown className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
      {loading ? t("preparing") : label}
    </Button>
  );
}
