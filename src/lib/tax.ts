export const PA_TAX_RATE = 0.06;

export interface TaxableItem {
  price: number;
  is_taxable: boolean;
}

/**
 * Sales tax for Witch on the Loose.
 *
 * Rule: only charge PA customers, only on taxable items. PA exempts most clothing;
 * the `is_taxable` flag on each product records whether it's taxable under PA rules.
 *
 * TODO(tax-v2): Philadelphia adds 2% local, Allegheny adds 1%. If/when she registers
 * for local licenses or the site grows, switch to destination-based by ZIP lookup.
 */
export function calculateTax(items: TaxableItem[], shippingState: string): number {
  if (shippingState.toUpperCase() !== "PA") return 0;

  const taxableSubtotal = items
    .filter((i) => i.is_taxable)
    .reduce((sum, i) => sum + i.price, 0);

  return Math.round(taxableSubtotal * PA_TAX_RATE * 100) / 100;
}
