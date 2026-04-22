import { describe, it, expect } from "vitest";
import { calculateShipping } from "./shipping";

describe("calculateShipping", () => {
  it("returns 0 for an empty cart", () => {
    expect(calculateShipping(0)).toBe(0);
    expect(calculateShipping(-10)).toBe(0);
  });

  it("charges $8 under $50", () => {
    expect(calculateShipping(0.01)).toBe(8.0);
    expect(calculateShipping(25)).toBe(8.0);
    expect(calculateShipping(49.99)).toBe(8.0);
  });

  it("charges $10 at $50 to just under $100", () => {
    expect(calculateShipping(50)).toBe(10.0);
    expect(calculateShipping(75)).toBe(10.0);
    expect(calculateShipping(99.99)).toBe(10.0);
  });

  it("charges $12 at $100 to just under $200", () => {
    expect(calculateShipping(100)).toBe(12.0);
    expect(calculateShipping(150)).toBe(12.0);
    expect(calculateShipping(199.99)).toBe(12.0);
  });

  it("is free at $200 and above", () => {
    expect(calculateShipping(200)).toBe(0);
    expect(calculateShipping(500)).toBe(0);
    expect(calculateShipping(10000)).toBe(0);
  });
});
