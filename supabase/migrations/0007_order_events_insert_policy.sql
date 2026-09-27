-- Global Tailor — order_events INSERT policy (found via live smoke test)
--
-- 0001 gave order_events a read policy but no INSERT policy, so every
-- client-side event write (createOrder's "placed", status changes, "shipped",
-- "fit_confirmed", measurement-review events) was silently denied by RLS and
-- the status timeline stayed empty. Allow a party to the order to append events.

create policy events_party_write on public.order_events for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = auth.uid() or o.tailor_id = auth.uid() or public.is_admin())
    )
  );
