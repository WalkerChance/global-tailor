-- Global Tailor — capture the delivery address on the order (Phase 1)
-- The order freezes a snapshot of the chosen shipping address (from the
-- customer's saved profile addresses), alongside the shipping option.

alter table public.orders
  add column if not exists shipping_address jsonb;
