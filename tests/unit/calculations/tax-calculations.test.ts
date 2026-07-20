import { describe, it, expect } from "vitest";

enum TaxType {
  VAT = "VAT",
  SALES_TAX = "SALES_TAX",
  GST = "GST",
  NONE = "NONE",
}

interface TaxRate {
  type: TaxType;
  rate: number;
  country: string;
  region?: string;
}

interface TaxableItem {
  amount: number;
  taxRate: number;
  isTaxExempt: boolean;
}

function getApplicableTaxRate(country: string, region?: string): TaxRate {
  const rates: Record<string, TaxRate> = {
    "US-CA": { type: TaxType.SALES_TAX, rate: 0.0875, country: "US", region: "CA" },
    "US-NY": { type: TaxType.SALES_TAX, rate: 0.08875, country: "US", region: "NY" },
    "US-TX": { type: TaxType.SALES_TAX, rate: 0.0825, country: "US", region: "TX" },
    "GB": { type: TaxType.VAT, rate: 0.20, country: "GB" },
    "DE": { type: TaxType.VAT, rate: 0.19, country: "DE" },
    "AU": { type: TaxType.GST, rate: 0.10, country: "AU" },
    "IN": { type: TaxType.GST, rate: 0.18, country: "IN" },
  };

  const key = region ? `${country}-${region}` : country;
  return rates[key] ?? { type: TaxType.NONE, rate: 0, country };
}

function calculateTaxForItem(item: TaxableItem): number {
  if (item.isTaxExempt) return 0;
  return item.amount * item.taxRate;
}

function calculateTotalTax(items: TaxableItem[]): number {
  return items.reduce((sum, item) => sum + calculateTaxForItem(item), 0);
}

function calculateTaxBreakdown(items: TaxableItem[]): { taxableAmount: number; nonTaxableAmount: number; taxAmount: number } {
  const taxableAmount = items.filter((i) => !i.isTaxExempt).reduce((sum, i) => sum + i.amount, 0);
  const nonTaxableAmount = items.filter((i) => i.isTaxExempt).reduce((sum, i) => sum + i.amount, 0);
  const taxAmount = calculateTotalTax(items);
  return { taxableAmount, nonTaxableAmount, taxAmount };
}

describe("Tax Calculations", () => {
  describe("getApplicableTaxRate", () => {
    it("returns California sales tax rate", () => {
      const rate = getApplicableTaxRate("US", "CA");
      expect(rate.type).toBe(TaxType.SALES_TAX);
      expect(rate.rate).toBe(0.0875);
    });

    it("returns UK VAT rate", () => {
      const rate = getApplicableTaxRate("GB");
      expect(rate.type).toBe(TaxType.VAT);
      expect(rate.rate).toBe(0.20);
    });

    it("returns NONE for unknown country", () => {
      const rate = getApplicableTaxRate("XX");
      expect(rate.type).toBe(TaxType.NONE);
      expect(rate.rate).toBe(0);
    });
  });

  describe("calculateTaxForItem", () => {
    it("calculates tax for taxable item", () => {
      expect(calculateTaxForItem({ amount: 100, taxRate: 0.1, isTaxExempt: false })).toBe(10);
    });

    it("returns 0 for tax-exempt item", () => {
      expect(calculateTaxForItem({ amount: 100, taxRate: 0.1, isTaxExempt: true })).toBe(0);
    });

    it("handles zero amount", () => {
      expect(calculateTaxForItem({ amount: 0, taxRate: 0.1, isTaxExempt: false })).toBe(0);
    });
  });

  describe("calculateTotalTax", () => {
    it("sums tax for all items", () => {
      const items: TaxableItem[] = [
        { amount: 100, taxRate: 0.1, isTaxExempt: false },
        { amount: 200, taxRate: 0.05, isTaxExempt: false },
      ];
      expect(calculateTotalTax(items)).toBe(20);
    });

    it("excludes tax-exempt items", () => {
      const items: TaxableItem[] = [
        { amount: 100, taxRate: 0.1, isTaxExempt: true },
        { amount: 200, taxRate: 0.1, isTaxExempt: false },
      ];
      expect(calculateTotalTax(items)).toBe(20);
    });
  });

  describe("calculateTaxBreakdown", () => {
    it("provides correct breakdown", () => {
      const items: TaxableItem[] = [
        { amount: 100, taxRate: 0.1, isTaxExempt: false },
        { amount: 50, taxRate: 0.1, isTaxExempt: true },
      ];
      const result = calculateTaxBreakdown(items);
      expect(result.taxableAmount).toBe(100);
      expect(result.nonTaxableAmount).toBe(50);
      expect(result.taxAmount).toBe(10);
    });
  });
});
