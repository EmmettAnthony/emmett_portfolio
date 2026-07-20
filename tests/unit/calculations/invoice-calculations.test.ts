import { describe, it, expect } from "vitest";

function calculateSubtotal(items: Array<{ quantity: number; unitPrice: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

function calculateTaxTotal(
  items: Array<{ quantity: number; unitPrice: number; taxRate: number; discount: number }>,
): number {
  return items.reduce((sum, item) => {
    const afterDiscount = item.quantity * item.unitPrice * (1 - item.discount / 100);
    return sum + afterDiscount * (item.taxRate / 100);
  }, 0);
}

function calculateDiscountTotal(
  items: Array<{ quantity: number; unitPrice: number; discount: number }>,
): number {
  return items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice * (item.discount / 100);
  }, 0);
}

function calculateTotal(
  items: Array<{ quantity: number; unitPrice: number; taxRate: number; discount: number }>,
): number {
  const subtotal = calculateSubtotal(items);
  const discountTotal = calculateDiscountTotal(items);
  const taxTotal = calculateTaxTotal(items);
  return subtotal - discountTotal + taxTotal;
}

function calculateBalanceDue(total: number, amountPaid: number): number {
  return Math.max(0, total - amountPaid);
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function parseInvoiceNumber(num: string): { prefix: string; year: string; sequence: number } | null {
  const match = num.match(/^([A-Z]+)-(\d{4})-(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], year: match[2], sequence: parseInt(match[3]) };
}

describe("Invoice Calculations", () => {
  describe("calculateSubtotal", () => {
    it("calculates subtotal for single item", () => {
      expect(calculateSubtotal([{ quantity: 1, unitPrice: 100 }])).toBe(100);
    });

    it("calculates subtotal for multiple items", () => {
      expect(calculateSubtotal([
        { quantity: 2, unitPrice: 50 },
        { quantity: 3, unitPrice: 100 },
      ])).toBe(400);
    });

    it("returns 0 for empty items", () => {
      expect(calculateSubtotal([])).toBe(0);
    });

    it("handles zero quantities", () => {
      expect(calculateSubtotal([{ quantity: 0, unitPrice: 100 }])).toBe(0);
    });

    it("handles zero unit prices", () => {
      expect(calculateSubtotal([{ quantity: 5, unitPrice: 0 }])).toBe(0);
    });
  });

  describe("calculateTaxTotal", () => {
    it("calculates tax correctly", () => {
      const items = [{ quantity: 1, unitPrice: 100, taxRate: 10, discount: 0 }];
      expect(calculateTaxTotal(items)).toBe(10);
    });

    it("applies discount before tax", () => {
      const items = [{ quantity: 1, unitPrice: 100, taxRate: 10, discount: 10 }];
      expect(calculateTaxTotal(items)).toBe(9);
    });

    it("returns 0 for zero tax rate", () => {
      const items = [{ quantity: 1, unitPrice: 100, taxRate: 0, discount: 0 }];
      expect(calculateTaxTotal(items)).toBe(0);
    });

    it("handles multiple items with different tax rates", () => {
      const items = [
        { quantity: 1, unitPrice: 100, taxRate: 10, discount: 0 },
        { quantity: 2, unitPrice: 50, taxRate: 5, discount: 0 },
      ];
      expect(calculateTaxTotal(items)).toBe(15);
    });
  });

  describe("calculateDiscountTotal", () => {
    it("calculates percentage discount", () => {
      expect(calculateDiscountTotal([{ quantity: 1, unitPrice: 100, discount: 10 }])).toBe(10);
    });

    it("returns 0 for no discount", () => {
      expect(calculateDiscountTotal([{ quantity: 1, unitPrice: 100, discount: 0 }])).toBe(0);
    });

    it("handles 100% discount", () => {
      expect(calculateDiscountTotal([{ quantity: 1, unitPrice: 100, discount: 100 }])).toBe(100);
    });
  });

  describe("calculateTotal", () => {
    it("calculates final total with tax and discount", () => {
      const items = [{ quantity: 1, unitPrice: 100, taxRate: 10, discount: 10 }];
      const total = calculateTotal(items);
      expect(total).toBe(99);
    });

    it("total equals subtotal when no tax or discount", () => {
      const items = [{ quantity: 1, unitPrice: 100, taxRate: 0, discount: 0 }];
      expect(calculateTotal(items)).toBe(100);
    });
  });

  describe("calculateBalanceDue", () => {
    it("returns full amount when nothing paid", () => {
      expect(calculateBalanceDue(1000, 0)).toBe(1000);
    });

    it("returns remaining balance for partial payment", () => {
      expect(calculateBalanceDue(1000, 300)).toBe(700);
    });

    it("returns 0 when fully paid", () => {
      expect(calculateBalanceDue(1000, 1000)).toBe(0);
    });

    it("returns 0 when overpaid", () => {
      expect(calculateBalanceDue(1000, 1200)).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("formats USD correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("formats EUR correctly", () => {
      expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
    });

    it("handles zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("handles large numbers", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });
  });

  describe("parseInvoiceNumber", () => {
    it("parses valid invoice number", () => {
      const result = parseInvoiceNumber("INV-2024-0001");
      expect(result).toEqual({ prefix: "INV", year: "2024", sequence: 1 });
    });

    it("returns null for invalid format", () => {
      expect(parseInvoiceNumber("invalid")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseInvoiceNumber("")).toBeNull();
    });
  });
});
