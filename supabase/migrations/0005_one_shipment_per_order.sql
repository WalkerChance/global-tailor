-- Global Tailor — one shipment per order (Phase 1)
-- Enforces the "no duplicate shipments" invariant at the DB level so concurrent
-- submits can't create two shipment rows for the same order. (Split shipments,
-- if ever needed, would relax this deliberately.)

create unique index if not exists shipments_order_id_uniq
  on public.shipments (order_id);
