"use client";

import { useTranslations } from "@/lib/i18n";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PricingCard } from "@/components/services/PricingCard";
import plans from "@/data/pricing.json";

export function PricingSection() {
  const t = useTranslations();
  return (
    <div>
      <SectionHeader
        title={t("services.pricingTitle")}
        subtitle={t("services.pricingSubtitle")}
      />

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {plans.map((plan, index) => (
          <PricingCard key={plan.id} plan={plan} index={index} />
        ))}
      </div>
    </div>
  );
}
