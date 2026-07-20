import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    siteSettings: {
      findFirst: mockFindFirst,
    },
  },
}));

import {
  loadFormFieldOptions,
  getEnabledOptions,
  DEFAULT_OPTIONS,
  DEFAULT_PROJECT_TYPES,
  DEFAULT_BUDGET_RANGES,
  DEFAULT_TIMELINE_OPTIONS,
  type FormOption,
} from "@/lib/form-field-options";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadFormFieldOptions", () => {
  it("returns DEFAULT_OPTIONS when no settings found in DB", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await loadFormFieldOptions();
    expect(result).toEqual(DEFAULT_OPTIONS);
    expect(mockFindFirst).toHaveBeenCalledWith({ where: { id: "global" } });
  });

  it("returns merged options when settings exist with formFieldOptions", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: {
        projectTypes: [
          { value: "web_development", label: "Custom Web Dev", enabled: false, order: 10 },
          { value: "new_type", label: "New Type", enabled: true, order: 1 },
        ],
        budgetRanges: [
          { value: "under_1000", enabled: false },
        ],
        timelineOptions: [],
      },
    });
    const result = await loadFormFieldOptions();
    expect(result.projectTypes).toHaveLength(2);
    expect(result.projectTypes[0]).toEqual({ value: "new_type", label: "New Type", enabled: true, order: 1 });
    expect(result.projectTypes[1]).toEqual({ value: "web_development", label: "Custom Web Dev", enabled: false, order: 10 });
    expect(result.budgetRanges).toHaveLength(1);
    expect(result.budgetRanges[0]).toEqual({ value: "under_1000", label: "Under $1,000", enabled: false, order: 1 });
    expect(result.timelineOptions).toEqual(DEFAULT_TIMELINE_OPTIONS);
  });

  it("returns DEFAULT_OPTIONS when prisma throws", async () => {
    mockFindFirst.mockRejectedValue(new Error("DB error"));
    const result = await loadFormFieldOptions();
    expect(result).toEqual(DEFAULT_OPTIONS);
  });

  it("returns DEFAULT_OPTIONS when settings exist but formFieldOptions is null", async () => {
    mockFindFirst.mockResolvedValue({ formFieldOptions: null });
    const result = await loadFormFieldOptions();
    expect(result).toEqual(DEFAULT_OPTIONS);
  });

  it("returns DEFAULT_OPTIONS when settings exist but formFieldOptions is undefined", async () => {
    mockFindFirst.mockResolvedValue({});
    const result = await loadFormFieldOptions();
    expect(result).toEqual(DEFAULT_OPTIONS);
  });
});

describe("mergeOptions (via loadFormFieldOptions)", () => {
  it("returns defaults when stored is undefined", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: { projectTypes: undefined },
    });
    const result = await loadFormFieldOptions();
    expect(result.projectTypes).toEqual(DEFAULT_PROJECT_TYPES);
  });

  it("returns defaults when stored is empty array", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: { projectTypes: [] },
    });
    const result = await loadFormFieldOptions();
    expect(result.projectTypes).toEqual(DEFAULT_PROJECT_TYPES);
  });

  it("returns defaults when stored is null", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: { projectTypes: null },
    });
    const result = await loadFormFieldOptions();
    expect(result.projectTypes).toEqual(DEFAULT_PROJECT_TYPES);
  });

  it("merges stored options with defaults (stored values override)", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: {
        projectTypes: [
          { value: "web_development", label: "Stored Label", enabled: false, order: 99 },
        ],
      },
    });
    const result = await loadFormFieldOptions();
    const webDev = result.projectTypes.find((o) => o.value === "web_development");
    expect(webDev).toBeDefined();
    expect(webDev!.label).toBe("Stored Label");
    expect(webDev!.enabled).toBe(false);
    expect(webDev!.order).toBe(99);
  });

  it("uses default label when stored doesn't provide one", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: {
        projectTypes: [{ value: "web_development" }],
      },
    });
    const result = await loadFormFieldOptions();
    const webDev = result.projectTypes.find((o) => o.value === "web_development");
    expect(webDev!.label).toBe("Web Development");
  });

  it("uses default enabled when stored doesn't specify", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: {
        projectTypes: [{ value: "web_development", label: "X" }],
      },
    });
    const result = await loadFormFieldOptions();
    const webDev = result.projectTypes.find((o) => o.value === "web_development");
    expect(webDev!.enabled).toBe(true);
  });

  it("uses default order when stored doesn't specify", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: {
        projectTypes: [{ value: "web_development", label: "X", enabled: true }],
      },
    });
    const result = await loadFormFieldOptions();
    const webDev = result.projectTypes.find((o) => o.value === "web_development");
    expect(webDev!.order).toBe(1);
  });

  it("sorts by order", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: {
        projectTypes: [
          { value: "z", label: "Z", enabled: true, order: 10 },
          { value: "a", label: "A", enabled: true, order: 1 },
          { value: "m", label: "M", enabled: true, order: 5 },
        ],
      },
    });
    const result = await loadFormFieldOptions();
    expect(result.projectTypes.map((o) => o.value)).toEqual(["a", "m", "z"]);
  });

  it("filters out entries without value", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: {
        projectTypes: [
          { value: "valid", label: "Valid", enabled: true, order: 1 },
          { label: "No Value", enabled: true, order: 2 } as any,
          { value: "", label: "Empty", enabled: true, order: 3 },
        ],
      },
    });
    const result = await loadFormFieldOptions();
    expect(result.projectTypes).toHaveLength(1);
    expect(result.projectTypes[0].value).toBe("valid");
  });

  it("handles partial stored data", async () => {
    mockFindFirst.mockResolvedValue({
      formFieldOptions: {
        projectTypes: [
          { value: "mobile_app", label: "Custom Mobile" },
        ],
      },
    });
    const result = await loadFormFieldOptions();
    const mobile = result.projectTypes.find((o) => o.value === "mobile_app");
    expect(mobile!.label).toBe("Custom Mobile");
    expect(mobile!.enabled).toBe(true);
    expect(mobile!.order).toBe(2);
  });
});

describe("getEnabledOptions", () => {
  it("returns only enabled options", () => {
    const options: FormOption[] = [
      { value: "a", label: "A", enabled: true, order: 1 },
      { value: "b", label: "B", enabled: false, order: 2 },
      { value: "c", label: "C", enabled: true, order: 3 },
    ];
    const result = getEnabledOptions(options);
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.value)).toEqual(["a", "c"]);
  });

  it("returns empty array when no options are enabled", () => {
    const options: FormOption[] = [
      { value: "a", label: "A", enabled: false, order: 1 },
      { value: "b", label: "B", enabled: false, order: 2 },
    ];
    const result = getEnabledOptions(options);
    expect(result).toEqual([]);
  });

  it("returns all when all are enabled", () => {
    const options: FormOption[] = [
      { value: "a", label: "A", enabled: true, order: 1 },
      { value: "b", label: "B", enabled: true, order: 2 },
    ];
    const result = getEnabledOptions(options);
    expect(result).toHaveLength(2);
    expect(result).toEqual(options);
  });

  it("returns empty array for empty input", () => {
    const result = getEnabledOptions([]);
    expect(result).toEqual([]);
  });
});
