import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let currentState: any = undefined;
let currentEffectFn: (() => void) | null = null;

vi.mock("react", () => ({
  useState: (initial: any) => {
    if (currentState === undefined) currentState = initial;
    return [currentState, (newVal: any) => {
      currentState = typeof newVal === "function" ? newVal(currentState) : newVal;
    }];
  },
  useEffect: (fn: () => void) => {
    currentEffectFn = fn;
  },
}));

beforeEach(() => {
  currentState = undefined;
  currentEffectFn = null;
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function flushMicrotasks() {
  await new Promise((resolve) => resolve(undefined));
  await new Promise((resolve) => resolve(undefined));
}

describe("useFormFieldOptions", () => {
  it("returns default enabled options on initial call", async () => {
    const { useFormFieldOptions } = await import("../hooks/useFormFieldOptions");

    const result = useFormFieldOptions();

    expect(result.projectTypes).toHaveLength(8);
    expect(result.budgetRanges).toHaveLength(6);
    expect(result.timelineOptions).toHaveLength(5);
    expect(result.projectTypes.map((p) => p.value)).toEqual([
      "web_development", "mobile_app", "crm_system", "ecommerce",
      "api_integration", "consulting", "wordpress", "other",
    ]);
    expect(currentEffectFn).toBeDefined();
  });

  it("updates options on successful fetch with valid data", async () => {
    const { useFormFieldOptions } = await import("../hooks/useFormFieldOptions");

    useFormFieldOptions();

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue({
      json: () => Promise.resolve({
        projectTypes: [
          { value: "web_development", label: "Web Dev", enabled: true, order: 1 },
          { value: "mobile_app", label: "Mobile", enabled: false, order: 2 },
        ],
        budgetRanges: [
          { value: "under_1000", label: "Under $1k", enabled: true, order: 1 },
        ],
        timelineOptions: [
          { value: "asap", label: "ASAP", enabled: true, order: 1 },
        ],
      }),
    });

    currentEffectFn!();
    await flushMicrotasks();

    const { useFormFieldOptions: reimport } = await import("../hooks/useFormFieldOptions");
    const result = reimport();

    expect(result.projectTypes).toHaveLength(1);
    expect(result.projectTypes[0].value).toBe("web_development");
    expect(result.budgetRanges).toHaveLength(1);
    expect(result.timelineOptions).toHaveLength(1);
  });

  it("ignores fetch response with missing data", async () => {
    const { useFormFieldOptions } = await import("../hooks/useFormFieldOptions");

    useFormFieldOptions();

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue({
      json: () => Promise.resolve({ projectTypes: [], budgetRanges: [] }),
    });

    currentEffectFn!();
    await flushMicrotasks();

    const { useFormFieldOptions: reimport } = await import("../hooks/useFormFieldOptions");
    const result = reimport();

    expect(result.projectTypes).toHaveLength(8);
    expect(result.budgetRanges).toHaveLength(6);
  });

  it("keeps defaults on fetch error", async () => {
    const { useFormFieldOptions } = await import("../hooks/useFormFieldOptions");

    useFormFieldOptions();

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValue(new Error("Network error"));

    currentEffectFn!();
    await flushMicrotasks();

    const { useFormFieldOptions: reimport } = await import("../hooks/useFormFieldOptions");
    const result = reimport();

    expect(result.projectTypes).toHaveLength(8);
  });

  it("keeps defaults on JSON parse error", async () => {
    const { useFormFieldOptions } = await import("../hooks/useFormFieldOptions");

    useFormFieldOptions();

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue({
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    currentEffectFn!();
    await flushMicrotasks();

    const { useFormFieldOptions: reimport } = await import("../hooks/useFormFieldOptions");
    const result = reimport();

    expect(result.projectTypes).toHaveLength(8);
  });

  it("filters out disabled options from fetch response", async () => {
    const { useFormFieldOptions } = await import("../hooks/useFormFieldOptions");

    useFormFieldOptions();

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue({
      json: () => Promise.resolve({
        projectTypes: [
          { value: "web_development", label: "Web", enabled: true, order: 1 },
          { value: "mobile_app", label: "Mobile", enabled: false, order: 2 },
          { value: "consulting", label: "Consulting", enabled: true, order: 3 },
        ],
        budgetRanges: [
          { value: "under_1000", label: "Low", enabled: true, order: 1 },
          { value: "25000_plus", label: "High", enabled: false, order: 2 },
        ],
        timelineOptions: [
          { value: "asap", label: "ASAP", enabled: true, order: 1 },
          { value: "flexible", label: "Flexible", enabled: false, order: 2 },
        ],
      }),
    });

    currentEffectFn!();
    await flushMicrotasks();

    const { useFormFieldOptions: reimport } = await import("../hooks/useFormFieldOptions");
    const result = reimport();

    expect(result.projectTypes.map((p) => p.value)).toEqual(["web_development", "consulting"]);
    expect(result.budgetRanges.map((b) => b.value)).toEqual(["under_1000"]);
    expect(result.timelineOptions.map((t) => t.value)).toEqual(["asap"]);
  });
});
