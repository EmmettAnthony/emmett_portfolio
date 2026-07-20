import { useState, useEffect } from "react";

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

const DEFAULT_PROJECT_TYPES: FormOption[] = [
  { value: "web_development", label: "Web Development", enabled: true, order: 1 },
  { value: "mobile_app", label: "Mobile App", enabled: true, order: 2 },
  { value: "crm_system", label: "CRM System", enabled: true, order: 3 },
  { value: "ecommerce", label: "E-Commerce", enabled: true, order: 4 },
  { value: "api_integration", label: "API Integration", enabled: true, order: 5 },
  { value: "consulting", label: "Consulting", enabled: true, order: 6 },
  { value: "wordpress", label: "WordPress", enabled: true, order: 7 },
  { value: "other", label: "Other", enabled: true, order: 8 },
];

const DEFAULT_BUDGET_RANGES: FormOption[] = [
  { value: "under_1000", label: "Under $1,000", enabled: true, order: 1 },
  { value: "1000_5000", label: "$1,000 - $5,000", enabled: true, order: 2 },
  { value: "5000_10000", label: "$5,000 - $10,000", enabled: true, order: 3 },
  { value: "10000_25000", label: "$10,000 - $25,000", enabled: true, order: 4 },
  { value: "25000_plus", label: "$25,000+", enabled: true, order: 5 },
  { value: "not_sure", label: "Not Sure", enabled: true, order: 6 },
];

const DEFAULT_TIMELINE_OPTIONS: FormOption[] = [
  { value: "asap", label: "ASAP (1-2 weeks)", enabled: true, order: 1 },
  { value: "short", label: "Short (2-4 weeks)", enabled: true, order: 2 },
  { value: "medium", label: "Medium (1-3 months)", enabled: true, order: 3 },
  { value: "flexible", label: "Flexible (3+ months)", enabled: true, order: 4 },
  { value: "not_sure", label: "Not Sure", enabled: true, order: 5 },
];

const DEFAULTS: FormFieldOptions = {
  projectTypes: DEFAULT_PROJECT_TYPES,
  budgetRanges: DEFAULT_BUDGET_RANGES,
  timelineOptions: DEFAULT_TIMELINE_OPTIONS,
};

function filterEnabled(options: FormOption[]): FormOption[] {
  return options.filter((o) => o.enabled);
}

export function useFormFieldOptions(): FormFieldOptions {
  const [options, setOptions] = useState<FormFieldOptions>(DEFAULTS);

  useEffect(() => {
    fetch("/api/dashboard/settings/form-fields")
      .then((res) => res.json())
      .then((json: FormFieldOptions) => {
        if (json?.projectTypes && json?.budgetRanges && json?.timelineOptions) {
          setOptions(json);
        }
      })
      .catch(() => {
        // Silently fall back to defaults on error
      });
  }, []);

  return {
    projectTypes: filterEnabled(options.projectTypes),
    budgetRanges: filterEnabled(options.budgetRanges),
    timelineOptions: filterEnabled(options.timelineOptions),
  };
}
