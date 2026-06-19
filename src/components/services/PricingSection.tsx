"use client";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { PricingCard } from "@/components/services/PricingCard";
import plans from "@/data/pricing.json";

export function PricingSection() {
  return (
    <div>
      <SectionHeader
        title="Pricing Plans"
        subtitle="Flexible pricing to fit projects of any size and scope."
      />

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {plans.map((plan, index) => (
          <PricingCard key={plan.id} plan={plan} index={index} />
        ))}
      </div>
    </div>
  );
}
