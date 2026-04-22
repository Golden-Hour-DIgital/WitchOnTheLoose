import { describe, it, expect } from "vitest";
import { calculateTax, PA_TAX_RATE } from "./tax";

type Item = { price: number; is_taxable: boolean };

describe("calculateTax", () => {
  it("returns 0 when shipping outside PA", () => {
    const items: Item[] = [
      { price: 100, is_taxable: true },
      { price: 50, is_taxable: false },
    ];
    expect(calculateTax(items, "NY")).toBe(0);
    expect(calculateTax(items, "CA")).toBe(0);
  });

  it("returns 0 when PA but no items are taxable", () => {
    const items: Item[] = [
      { price: 100, is_taxable: false },
      { price: 50, is_taxable: false },
    ];
    expect(calculateTax(items, "PA")).toBe(0);
  });

  it("applies 6% to taxable items only when shipping to PA", () => {
    const items: Item[] = [
      { price: 100, is_taxable: true },  // taxable
      { price: 50, is_taxable: false },  // exempt
    ];
    // 100 * 0.06 = 6.00
    expect(calculateTax(items, "PA")).toBeCloseTo(6.0, 2);
  });

  it("sums taxable items across the cart", () => {
    const items: Item[] = [
      { price: 100, is_taxable: true },
      { price: 50, is_taxable: true },
      { price: 25, is_taxable: false },
    ];
    // (100 + 50) * 0.06 = 9.00
    expect(calculateTax(items, "PA")).toBeCloseTo(9.0, 2);
  });

  it("rounds to cents (2 decimals)", () => {
    const items: Item[] = [{ price: 33.33, is_taxable: true }];
    // 33.33 * 0.06 = 1.9998 → 2.00
    expect(calculateTax(items, "PA")).toBe(2.0);
  });

  it("is case-insensitive on state code", () => {
    const items: Item[] = [{ price: 100, is_taxable: true }];
    expect(calculateTax(items, "pa")).toBeCloseTo(6.0, 2);
    expect(calculateTax(items, "Pa")).toBeCloseTo(6.0, 2);
  });

  it("exports the PA rate as a constant", () => {
    expect(PA_TAX_RATE).toBe(0.06);
  });
});
