import { describe, it, expect } from "vitest";

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

interface Discount {
  type: DiscountType;
  value: number;
  code?: string;
  maxUses?: number;
  currentUses?: number;
  minOrderAmount?: number;
  isActive: boolean;
}

interface DiscountResult {
  discountAmount: number;
  finalAmount: number;
  description: string;
}

function applyDiscount(
  amount: number,
  discount: Discount,
): DiscountResult {
  if (!discount.isActive) {
    return { discountAmount: 0, finalAmount: amount, description: "Discount inactive" };
  }

  if (discount.minOrderAmount && amount < discount.minOrderAmount) {
    return { discountAmount: 0, finalAmount: amount, description: `Minimum order: $${discount.minOrderAmount}` };
  }

  if (discount.maxUses !== undefined && discount.currentUses !== undefined && discount.currentUses >= discount.maxUses) {
    return { discountAmount: 0, finalAmount: amount, description: "Discount usage limit reached" };
  }

  switch (discount.type) {
    case "PERCENTAGE": {
      const discountAmount = (amount * discount.value) / 100;
      return {
        discountAmount,
        finalAmount: amount - discountAmount,
        description: `${discount.value}% off`,
      };
    }
    case "FIXED_AMOUNT": {
      const discountAmount = Math.min(discount.value, amount);
      return {
        discountAmount,
        finalAmount: amount - discountAmount,
        description: `$${discount.value} off`,
      };
    }
    case "FREE_SHIPPING":
      return { discountAmount: 0, finalAmount: amount, description: "Free shipping" };
    default:
      return { discountAmount: 0, finalAmount: amount, description: "Unknown discount type" };
  }
}

function validateDiscountCode(code: string): { valid: boolean; reason?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, reason: "Code cannot be empty" };
  }
  if (code.length < 3) {
    return { valid: false, reason: "Code too short" };
  }
  if (code.length > 20) {
    return { valid: false, reason: "Code too long" };
  }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { valid: false, reason: "Invalid characters in code" };
  }
  return { valid: true };
}

describe("Discount Calculations", () => {
  describe("applyDiscount", () => {
    const baseDiscount: Discount = {
      type: "PERCENTAGE",
      value: 10,
      isActive: true,
    };

    it("applies percentage discount", () => {
      const result = applyDiscount(100, baseDiscount);
      expect(result.discountAmount).toBe(10);
      expect(result.finalAmount).toBe(90);
    });

    it("applies fixed amount discount", () => {
      const result = applyDiscount(100, { ...baseDiscount, type: "FIXED_AMOUNT", value: 15 });
      expect(result.discountAmount).toBe(15);
      expect(result.finalAmount).toBe(85);
    });

    it("fixed discount does not exceed order amount", () => {
      const result = applyDiscount(20, { ...baseDiscount, type: "FIXED_AMOUNT", value: 50 });
      expect(result.discountAmount).toBe(20);
      expect(result.finalAmount).toBe(0);
    });

    it("returns 0 discount for inactive discount", () => {
      const result = applyDiscount(100, { ...baseDiscount, isActive: false });
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(100);
    });

    it("enforces minimum order amount", () => {
      const result = applyDiscount(50, { ...baseDiscount, minOrderAmount: 100 });
      expect(result.discountAmount).toBe(0);
    });

    it("enforces usage limit", () => {
      const result = applyDiscount(100, { ...baseDiscount, maxUses: 5, currentUses: 5 });
      expect(result.discountAmount).toBe(0);
    });
  });

  describe("validateDiscountCode", () => {
    it("accepts valid code", () => {
      expect(validateDiscountCode("SAVE20")).toEqual({ valid: true });
    });

    it("rejects empty code", () => {
      expect(validateDiscountCode("").valid).toBe(false);
    });

    it("rejects short code", () => {
      expect(validateDiscountCode("AB").valid).toBe(false);
    });

    it("rejects code with spaces", () => {
      expect(validateDiscountCode("SAVE 20").valid).toBe(false);
    });

    it("rejects code with special characters", () => {
      expect(validateDiscountCode("SAVE@20").valid).toBe(false);
    });

    it("accepts code with underscores and hyphens", () => {
      expect(validateDiscountCode("SAVE_20-OFF")).toEqual({ valid: true });
    });
  });
});
