import { AnimatedSection } from "@/components/shared/AnimatedSection";
import type { Metadata } from "next";
import { ResumeContent } from "@/components/resume/ResumeContent";

export const metadata: Metadata = {
  title: "Resume | Emmett Anthony",
  description:
    "Professional resume and CV of Emmett Anthony, a software developer with 3+ years of experience.",
};

export default function Resume() {
  return (
    <main className="pt-24">
      <AnimatedSection>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ResumeContent />
        </div>
      </AnimatedSection>
    </main>
  );
}
