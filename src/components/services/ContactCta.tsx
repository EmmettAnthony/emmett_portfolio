"use client";

import { Phone } from "lucide-react";
import { CtaSection } from "@/components/shared/CtaSection";
import { useTranslations } from "@/lib/i18n";

export function ContactCta() {
  const t = useTranslations("services.contactCta");
  return (
    <CtaSection
      title={t("title")}
      description={t("description")}
      overlay="blue-purple"
      showDecoration={false}
      primaryButton={{
        text: t("primary"),
        href: "/contact",
      }}
      secondaryButtons={[
        {
          text: t("secondary"),
          href: "/contact?type=consultation",
          icon: Phone,
        },
      ]}
    />
  );
}
