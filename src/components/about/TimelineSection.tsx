"use client";

import { Timeline } from "@/components/shared/Timeline";
import { SectionHeader } from "@/components/shared/SectionHeader";
import resume from "@/data/resume.json";

const timelineItems = resume.experience.map((exp) => ({
  id: exp.id,
  title: exp.position,
  subtitle: `${exp.company} • ${exp.location}`,
  date: `${exp.startDate} - ${exp.current ? "Present" : exp.endDate}`,
  description: exp.description,
}));

export function TimelineSection() {
  return (
    <div className="mt-24">
      <SectionHeader
        title="Career Journey"
        subtitle="My professional experience and growth over the years."
      />
      <div className="mx-auto mt-16 max-w-2xl">
        <Timeline items={timelineItems} />
      </div>
    </div>
  );
}
