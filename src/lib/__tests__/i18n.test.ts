import { describe, it, expect } from "vitest";
import { t } from "../i18n";

describe("t", () => {
  it("returns the fallback string", () => {
    expect(t("some.key", "Hello World")).toBe("Hello World");
  });

  it("returns an empty string fallback", () => {
    expect(t("some.key", "")).toBe("");
  });
});
