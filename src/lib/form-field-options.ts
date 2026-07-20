import { prisma } from "@/lib/db";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FormOption {
  value: string;
  label: string;
  enabled: boolean;
  order: number;
}

export interface FormFieldOptions {
  projectTypes: FormOption[];
  budgetRanges: FormOption[];
  timelineOptions: FormOption[];
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_PROJECT_TYPES: FormOption[] = [
  { value: "web_development", label: "Web Development", enabled: true, order: 1 },
  { value: "mobile_app", label: "Mobile App", enabled: true, order: 2 },
  { value: "crm_system", label: "CRM System", enabled: true, order: 3 },
  { value: "ecommerce", label: "E-Commerce", enabled: true, order: 4 },
  { value: "api_integration", label: "API Integration", enabled: true, order: 5 },
  { value: "consulting", label: "Consulting", enabled: true, order: 6 },
  { value: "wordpress", label: "WordPress", enabled: true, order: 7 },
  { value: "other", label: "Other", enabled: true, order: 8 },
];

export const DEFAULT_BUDGET_RANGES: FormOption[] = [
  { value: "under_1000", label: "Under $1,000", enabled: true, order: 1 },
  { value: "1000_5000", label: "$1,000 - $5,000", enabled: true, order: 2 },
  { value: "5000_10000", label: "$5,000 - $10,000", enabled: true, order: 3 },
  { value: "10000_25000", label: "$10,000 - $25,000", enabled: true, order: 4 },
  { value: "25000_plus", label: "$25,000+", enabled: true, order: 5 },
  { value: "not_sure", label: "Not Sure", enabled: true, order: 6 },
];

export const DEFAULT_TIMELINE_OPTIONS: FormOption[] = [
  { value: "asap", label: "ASAP (1-2 weeks)", enabled: true, order: 1 },
  { value: "short", label: "Short (2-4 weeks)", enabled: true, order: 2 },
  { value: "medium", label: "Medium (1-3 months)", enabled: true, order: 3 },
  { value: "flexible", label: "Flexible (3+ months)", enabled: true, order: 4 },
  { value: "not_sure", label: "Not Sure", enabled: true, order: 5 },
];

export const DEFAULT_OPTIONS: FormFieldOptions = {
  projectTypes: DEFAULT_PROJECT_TYPES,
  budgetRanges: DEFAULT_BUDGET_RANGES,
  timelineOptions: DEFAULT_TIMELINE_OPTIONS,
};

// ─── Merge Helper ───────────────────────────────────────────────────────────

function mergeOptions(
  stored: { value: string; label?: string; enabled?: boolean; order?: number }[] | undefined,
  defaults: FormOption[]
): FormOption[] {
  if (!stored || !Array.isArray(stored) || stored.length === 0) return defaults;

  // Build a map of defaults by value
  const defaultMap = new Map(defaults.map((d) => [d.value, d]));

  return stored
    .filter((s) => s?.value)
    .map((s) => ({
      value: s.value,
      label: s.label || defaultMap.get(s.value)?.label || s.value,
      enabled: s.enabled !== undefined ? s.enabled : defaultMap.get(s.value)?.enabled ?? true,
      order: s.order ?? defaultMap.get(s.value)?.order ?? 999,
    }))
    .sort((a, b) => a.order - b.order);
}

// ─── Load from DB ───────────────────────────────────────────────────────────

export async function loadFormFieldOptions(): Promise<FormFieldOptions> {
  try {
    const settings = await prisma.siteSettings.findFirst({ where: { id: "global" } });
    if (!settings?.formFieldOptions) return DEFAULT_OPTIONS;

    const stored = settings.formFieldOptions as Record<string, unknown>;
    const storedProjectTypes = stored.projectTypes as { value: string; label?: string; enabled?: boolean; order?: number }[] | undefined;
    const storedBudgetRanges = stored.budgetRanges as { value: string; label?: string; enabled?: boolean; order?: number }[] | undefined;
    const storedTimelineOptions = stored.timelineOptions as { value: string; label?: string; enabled?: boolean; order?: number }[] | undefined;

    return {
      projectTypes: mergeOptions(storedProjectTypes, DEFAULT_PROJECT_TYPES),
      budgetRanges: mergeOptions(storedBudgetRanges, DEFAULT_BUDGET_RANGES),
      timelineOptions: mergeOptions(storedTimelineOptions, DEFAULT_TIMELINE_OPTIONS),
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

// ─── Get only enabled options (for public forms) ────────────────────────────

export function getEnabledOptions(options: FormOption[]): FormOption[] {
  return options.filter((o) => o.enabled);
}


