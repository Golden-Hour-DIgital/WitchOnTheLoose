/**
 * Subtotal-based shipping tiers for Witch on the Loose.
 *
 * Ships from Huntingdon County, PA via Pirate Ship (USPS).
 * Tiers are priced to cover actual postage with a small margin on smaller orders
 * and to incentivize larger orders with free shipping at $200+.
 *
 * Update SHIPPING_TIERS here if USPS rates change or she wants different thresholds.
 */
export interface ShippingTier {
  /** Inclusive lower bound of order subtotal (USD). */
  minSubtotal: number;
  /** Shipping charge (USD). */
  cost: number;
}

export const SHIPPING_TIERS: ShippingTier[] = [
  { minSubtotal: 0, cost: 8.0 },
  { minSubtotal: 50, cost: 10.0 },
  { minSubtotal: 100, cost: 12.0 },
  { minSubtotal: 200, cost: 0 }, // free shipping
];

export function calculateShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  const tier = [...SHIPPING_TIERS]
    .reverse()
    .find((t) => subtotal >= t.minSubtotal);
  return tier ? tier.cost : SHIPPING_TIERS[0].cost;
}
