// Order price computation. Money is integer minor units (cents).
// Phase 1: platform fee and tax are 0 (no money moves). Kept in the shape so
// Phase 2 can populate them without changing callers.

export type PriceInput = {
  /** Per-garment-type base price (cents). */
  basePrice: number;
  /** Selected fabric price (cents). */
  fabricPrice: number;
  /** Price modifiers for each selected option value (cents). */
  optionModifiers: number[];
  /** Chosen shipping option's price (cents). */
  shipping: number;
};

export type PriceBreakdown = {
  subtotal: number;
  shipping_amount: number;
  platform_fee: number;
  tax_amount: number;
  total: number;
};

export function computeOrder(input: PriceInput): PriceBreakdown {
  const optionsTotal = input.optionModifiers.reduce((a, b) => a + b, 0);
  const subtotal = input.basePrice + input.fabricPrice + optionsTotal;
  const shipping_amount = input.shipping;
  const platform_fee = 0; // Phase 2
  const tax_amount = 0; // Phase 2 (Stripe Tax)
  const total = subtotal + shipping_amount + tax_amount;
  return { subtotal, shipping_amount, platform_fee, tax_amount, total };
}
