import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Biography } from "@/components/about/Biography";
import { TimelineSection } from "@/components/about/TimelineSection";
import { EducationSection } from "@/components/about/EducationSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Emmett Anthony",
  description:
    "Learn about Emmett Anthony, a professional software developer with 3+ years of experience building modern web applications.",
};

export default function About() {
  return (
    <main className="pt-24">
      <AnimatedSection>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Biography />
        </div>
      </AnimatedSection>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <TimelineSection />
        <EducationSection />
      </div>
    </main>
  );
}
