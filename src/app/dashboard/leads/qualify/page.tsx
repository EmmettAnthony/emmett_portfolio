import { LeadQualificationWizard } from "@/components/dashboard/LeadQualificationWizard";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function LeadQualifyPage() {
  const t = await getTranslations("dashboard.leads");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("qualifyNewLead")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("qualifyNewLeadDesc")}
        </p>
      </div>
      <LeadQualificationWizard />
    </div>
  );
}
