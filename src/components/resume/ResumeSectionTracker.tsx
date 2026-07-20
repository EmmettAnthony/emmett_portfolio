"use client";

import { useEffect, useRef } from "react";

type SectionName =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "awards"
  | "languages"
  | "references"
  | "featuredProjects";

interface ResumeSectionTrackerProps {
  section: SectionName;
  children: React.ReactNode;
}

export function ResumeSectionTracker({ section, children }: ResumeSectionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || tracked.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          fetch("/api/dashboard/resume/section-views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ section }),
          }).catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [section]);

  return <div ref={ref}>{children}</div>;
}
