-- Global Tailor — DEMO seed (optional, for smoke testing)
-- Sets up one fully-configured demo shop so you can try the configurator end to
-- end without clicking through every editor.
--
-- HOW TO USE:
--   1) Sign up a user in the app (this creates the auth user + customer profile).
--   2) Find their UUID: select id, email from auth.users;
--   3) Replace the uid below and run this whole script in the SQL editor.
-- Safe to re-run.

do $$
declare
  tailor uuid := 'REPLACE_WITH_TAILOR_USER_UUID';
  suit uuid;
  shirt uuid;
  pants uuid;
  navy uuid;
  linen uuid;
  grp uuid;
begin
  select id into suit  from public.garment_types where key = 'suit';
  select id into shirt from public.garment_types where key = 'shirt';
  select id into pants from public.garment_types where key = 'pants';

  -- Grant the tailor role.
  insert into public.user_roles (user_id, role)
  values (tailor, 'tailor')
  on conflict do nothing;

  -- Shop profile.
  insert into public.tailor_profiles
    (user_id, shop_name, slug, bio, location_city, location_country, languages, turnaround_days, verification_status)
  values
    (tailor, 'Demo Tailors', 'demo-tailors',
     'A demo shop seeded for testing the full build-and-order loop.',
     'Bangkok', 'Thailand', array['English','Thai'], 21, 'verified')
  on conflict (user_id) do update
    set shop_name = excluded.shop_name, slug = excluded.slug;

  -- Offer all three garment types with base prices.
  insert into public.shop_garment_types (tailor_id, garment_type_id, active, base_price, currency)
  values
    (tailor, suit,  true, 22000, 'USD'),
    (tailor, shirt, true,  6000, 'USD'),
    (tailor, pants, true,  9000, 'USD')
  on conflict (tailor_id, garment_type_id) do update
    set active = excluded.active, base_price = excluded.base_price;

  -- Fabrics.
  insert into public.fabrics (tailor_id, name, composition, color, pattern, price_amount, currency, availability)
  values
    (tailor, 'Navy Wool Herringbone', '100% wool', 'Navy', 'Herringbone', 8000, 'USD', 'in_stock'),
    (tailor, 'Ivory Linen',           '100% linen', 'Ivory', 'Plain',     5000, 'USD', 'in_stock'),
    (tailor, 'Charcoal Wool-Cashmere','90% wool / 10% cashmere', 'Charcoal', 'Plain', 12000, 'USD', 'in_stock')
  on conflict do nothing;

  -- One option group for suits (Lapel) with values.
  insert into public.option_groups (tailor_id, garment_type_id, name, required, multi_select)
  values (tailor, suit, 'Lapel', true, false)
  returning id into grp;

  if grp is not null then
    insert into public.option_values (option_group_id, name, price_modifier) values
      (grp, 'Notch', 0),
      (grp, 'Peak', 1500),
      (grp, 'Shawl', 2000);
  end if;

  -- Shipping.
  insert into public.shipping_options
    (tailor_id, label, carrier, base_price, additional_item_price, min_days, max_days, currency, destination_countries, active)
  values
    (tailor, 'DHL Express', 'DHL', 7000, 1500, 5, 7, 'USD', array['US'], true),
    (tailor, 'Economy',     'EMS', 3500, 1000, 14, 21, 'USD', array['US'], true)
  on conflict do nothing;
end $$;
