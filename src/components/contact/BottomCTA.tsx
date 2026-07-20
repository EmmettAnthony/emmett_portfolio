"use client";

import { Calendar, Download } from "lucide-react";
import { CtaSection } from "@/components/shared/CtaSection";
import { trackEvent } from "@/lib/analytics";
import { useTranslations } from "@/lib/i18n";

export function BottomCTA() {
  const t = useTranslations("contact.bottomCta");
  const handleSchedule = () => {
    trackEvent("schedule_click", "Bottom CTA");
    const title = encodeURIComponent(t("calendarTitle"));
    const details = encodeURIComponent(t("calendarDetails"));
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDownload = () => {
    trackEvent("cv_download", "Bottom CTA");
    window.print();
  };

  return (
    <CtaSection
      title={t("title")}
      description={t("description")}
      overlay="blue-purple"
      showDecoration={true}
      primaryButton={{
        text: t("hireMe"),
        href: "/contact",
      }}
      secondaryButtons={[
        {
          text: t("scheduleCall"),
          onClick: handleSchedule,
          icon: Calendar,
        },
        {
          text: t("downloadResume"),
          onClick: handleDownload,
          icon: Download,
        },
      ]}
    />
  );
}
