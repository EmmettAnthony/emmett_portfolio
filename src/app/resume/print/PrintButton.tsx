"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export function PrintButton() {
  const t = useTranslations("resume");
  return (
    <button onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      {t("printOrSave")}
    </button>
  );
}
