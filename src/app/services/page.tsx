import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { ServicesGrid } from "@/components/services/ServicesGrid";
import { PricingSection } from "@/components/services/PricingSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | Emmett Anthony",
  description:
    "Professional web development, software development, e-commerce, and consulting services offered by Emmett Anthony.",
};

export default function Services() {
  return (
    <main className="pt-24">
      <AnimatedSection>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ServicesGrid />
        </div>
      </AnimatedSection>

      <div className="bg-zinc-50 py-20 dark:bg-zinc-900/50 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <PricingSection />
        </div>
      </div>
    </main>
  );
}
