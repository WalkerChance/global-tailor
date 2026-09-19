import { describe, it, expect } from "vitest";
import { computeOrder } from "./pricing";

describe("computeOrder", () => {
  it("sums base + fabric + options into the subtotal", () => {
    const b = computeOrder({
      basePrice: 20000, // $200 suit base
      fabricPrice: 8000, // $80 fabric
      optionModifiers: [1500, 500], // peak lapel + monogram
      shipping: 7000, // $70 flat DHL
    });
    expect(b.subtotal).toBe(30000);
    expect(b.shipping_amount).toBe(7000);
    expect(b.total).toBe(37000);
  });

  it("keeps platform fee and tax at 0 in Phase 1", () => {
    const b = computeOrder({
      basePrice: 5000,
      fabricPrice: 0,
      optionModifiers: [],
      shipping: 0,
    });
    expect(b.platform_fee).toBe(0);
    expect(b.tax_amount).toBe(0);
    expect(b.total).toBe(5000);
  });

  it("handles no options", () => {
    const b = computeOrder({
      basePrice: 12000,
      fabricPrice: 3000,
      optionModifiers: [],
      shipping: 4000,
    });
    expect(b.subtotal).toBe(15000);
    expect(b.total).toBe(19000);
  });
});
