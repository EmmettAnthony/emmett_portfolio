"use client";

import { Timeline } from "@/components/shared/Timeline";
import { useTranslations } from "@/lib/i18n";
import { SectionHeader } from "@/components/shared/SectionHeader";

interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  current: boolean;
  responsibilities: string[];
}

interface TimelineSectionProps {
  experiences?: ExperienceItem[];
}

export function TimelineSection({ experiences = [] }: TimelineSectionProps) {
  const t = useTranslations();
  const timelineItems = experiences.map((exp) => ({
    id: exp.id,
    title: exp.jobTitle,
    subtitle: `${exp.company}${exp.location ? ` • ${exp.location}` : ""}`,
    date: `${formatDate(exp.startDate)} - ${exp.current ? t("about.timeline.present") : exp.endDate ? formatDate(exp.endDate) : ""}`,
    description: exp.responsibilities,
  }));

  return (
    <div className="mt-24">
      <SectionHeader
        title={t("about.timeline.title")}
        subtitle={t("about.timeline.subtitle")}
      />
      <div className="mx-auto mt-16 max-w-2xl">
        <Timeline items={timelineItems} />
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  const date = new Date(d);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
