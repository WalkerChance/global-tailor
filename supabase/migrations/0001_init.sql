-- Global Tailor — initial schema (Phase 1)
-- Mobile-first marketplace: tailors run shops, customers build garments.
-- US-only at launch; schema is scale-ready. Payments/tax arrive in Phase 2
-- (columns exist, but no charge happens in Phase 1 — see is_test on orders).
--
-- Conventions:
--   * money is stored as BIGINT minor units (cents) + a currency code. Never floats.
--   * ownership: a tailor's user_id is the shop id; customer's user_id is the profile id.
--   * RLS is enabled on every table; policies are defined at the bottom.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;      -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role            as enum ('customer', 'tailor', 'admin', 'finisher');
create type public.verification_status  as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.media_kind           as enum ('fabric', 'garment', 'sample', 'measurement_video', 'evidence', 'other');
create type public.ai_status            as enum ('none', 'pending', 'done', 'failed');
create type public.measurement_source   as enum ('manual', 'garment', 'video', 'ar');
create type public.order_status         as enum ('draft', 'placed', 'accepted', 'in_production', 'shipped', 'delivered', 'fit_confirmed', 'cancelled');
create type public.review_status        as enum ('pending', 'customer_accepted', 'customer_declined');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Role check that safely bypasses RLS on user_roles (security definer).
create or replace function public.has_role(_role public.user_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('admin');
$$;

grant execute on function public.has_role(public.user_role) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ===========================================================================
-- Identity & access
-- ===========================================================================

-- Mirror of auth.users we can join/FK against.
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  name        text,
  locale      text,
  country     text,
  created_at  timestamptz not null default now()
);

-- Role assignments (a user may hold more than one role).
create table public.user_roles (
  user_id    uuid not null references public.users (id) on delete cascade,
  role       public.user_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.users (id),
  primary key (user_id, role)
);

-- On signup: mirror the user, grant the default customer role, create a profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict do nothing;

  insert into public.customers (user_id)
  values (new.id)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Profiles
-- ===========================================================================

create table public.tailor_profiles (
  user_id             uuid primary key references public.users (id) on delete cascade,
  shop_name           text not null,
  slug                text unique not null,
  bio                 text,
  location_country    text,
  location_city       text,
  languages           text[] not null default '{}',
  turnaround_days     int,
  verification_status public.verification_status not null default 'unverified',
  stripe_account_id   text,                         -- Phase 2 (Stripe Connect)
  rating_avg          numeric(3,2),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_tailor_profiles_updated before update on public.tailor_profiles
  for each row execute function public.set_updated_at();

-- The customer profile — reusable across orders.
create table public.customers (
  user_id                        uuid primary key references public.users (id) on delete cascade,
  display_name                   text,
  phone                          text,
  shipping_addresses             jsonb not null default '[]',   -- [{id,label,line1,...,country}]
  default_address_id             text,
  default_measurement_profile_id uuid,                          -- FK added after measurement_profiles
  stripe_customer_id             text,                          -- Phase 2 (saved cards live on Stripe)
  preferences                    jsonb,                         -- POST-MVP (style/fit/comms)
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now()
);
create trigger trg_customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Catalog taxonomy
-- ===========================================================================

-- Standard types (suits/shirts/pants) at launch. Custom types are rows with
-- owner_tailor_id set — no schema change needed later.
create table public.garment_types (
  id                     uuid primary key default gen_random_uuid(),
  key                    text unique not null,        -- 'suit' | 'shirt' | 'pants' | ...
  name                   text not null,
  is_standard            boolean not null default false,
  owner_tailor_id        uuid references public.tailor_profiles (user_id) on delete cascade,
  created_at             timestamptz not null default now()
);

-- Extensible measurement schema per garment type. owner_tailor_id null = standard;
-- set = a tailor's custom ask (later). AR later writes into these same fields.
create table public.measurement_fields (
  id              uuid primary key default gen_random_uuid(),
  garment_type_id uuid not null references public.garment_types (id) on delete cascade,
  key             text not null,               -- 'chest' | 'waist' | ...
  label           text not null,
  unit            text not null default 'in',
  required        boolean not null default true,
  sort            int not null default 0,
  owner_tailor_id uuid references public.tailor_profiles (user_id) on delete cascade,
  -- NULLS NOT DISTINCT so two standard rows (null owner) with the same key collide.
  constraint measurement_fields_uniq unique nulls not distinct (garment_type_id, key, owner_tailor_id)
);

-- Which garment types a shop offers (selectable when setting up the shop).
create table public.shop_garment_types (
  tailor_id       uuid not null references public.tailor_profiles (user_id) on delete cascade,
  garment_type_id uuid not null references public.garment_types (id) on delete cascade,
  active          boolean not null default true,
  base_price      bigint not null default 0,   -- per-type base, minor units
  currency        text not null default 'USD',
  primary key (tailor_id, garment_type_id)
);

-- ===========================================================================
-- Media & catalog content
-- ===========================================================================

-- Single source of truth for all images/video. Store URLs/links, never blobs.
create table public.media (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  kind          public.media_kind not null default 'other',
  storage_path  text,
  public_url    text,
  mime_type     text,
  width         int,
  height        int,
  alt_text      text,
  ai_status     public.ai_status not null default 'none',
  created_at    timestamptz not null default now()
);

create table public.fabrics (
  id              uuid primary key default gen_random_uuid(),
  tailor_id       uuid not null references public.tailor_profiles (user_id) on delete cascade,
  name            text not null,
  composition     text,
  weight_gsm      int,
  color           text,
  pattern         text,
  price_tier      text,
  price_amount    bigint not null default 0,   -- minor units
  currency        text not null default 'USD',
  availability    text,
  source_media_id uuid references public.media (id) on delete set null,  -- raw upload
  tile_media_id   uuid references public.media (id) on delete set null,  -- normalized swatch
  ai_attributes   jsonb,                                                 -- vision-extracted
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_fabrics_updated before update on public.fabrics
  for each row execute function public.set_updated_at();

-- Type -> material pricing tie-through (scalable; MVP may leave empty).
create table public.garment_fabric_pricing (
  id              uuid primary key default gen_random_uuid(),
  tailor_id       uuid not null references public.tailor_profiles (user_id) on delete cascade,
  garment_type_id uuid not null references public.garment_types (id) on delete cascade,
  fabric_id       uuid not null references public.fabrics (id) on delete cascade,
  price_amount    bigint,                       -- explicit price for this fabric in this garment
  yardage_factor  numeric(6,2),                 -- OR compute from fabric price x consumption
  unique (garment_type_id, fabric_id)
);

create table public.option_groups (
  id              uuid primary key default gen_random_uuid(),
  tailor_id       uuid not null references public.tailor_profiles (user_id) on delete cascade,
  garment_type_id uuid not null references public.garment_types (id) on delete cascade,
  name            text not null,               -- e.g. 'Lapel'
  required        boolean not null default false,
  multi_select    boolean not null default false,
  sort            int not null default 0
);

create table public.option_values (
  id              uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.option_groups (id) on delete cascade,
  name            text not null,               -- e.g. 'Peak'
  price_modifier  bigint not null default 0,
  media_id        uuid references public.media (id) on delete set null,
  sort            int not null default 0
);

create table public.samples (
  id              uuid primary key default gen_random_uuid(),
  tailor_id       uuid not null references public.tailor_profiles (user_id) on delete cascade,
  garment_type_id uuid references public.garment_types (id) on delete set null,
  title           text not null,
  description     text,
  media_ids       uuid[] not null default '{}',
  created_at      timestamptz not null default now()
);

-- Flat-rate shipping options the tailor sets & quotes (not live carrier rates).
create table public.shipping_options (
  id                    uuid primary key default gen_random_uuid(),
  tailor_id             uuid not null references public.tailor_profiles (user_id) on delete cascade,
  label                 text not null,
  carrier               text,
  base_price            bigint not null default 0,    -- first item, minor units
  additional_item_price bigint,                       -- per extra item
  per_item_type_pricing jsonb,                        -- optional {garment_type_key: price}
  min_days              int,
  max_days              int,
  currency              text not null default 'USD',
  destination_countries text[] not null default '{US}',
  active                boolean not null default true
);

-- ===========================================================================
-- Measurements
-- ===========================================================================

create table public.measurement_profiles (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers (user_id) on delete cascade,
  label             text,
  garment_type_id   uuid references public.garment_types (id) on delete set null,
  values            jsonb not null default '{}',      -- { field_key: number }
  source            public.measurement_source not null default 'manual',
  source_media_id   uuid references public.media (id) on delete set null,
  last_confirmed_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_measurement_profiles_updated before update on public.measurement_profiles
  for each row execute function public.set_updated_at();

alter table public.customers
  add constraint customers_default_measurement_profile_fk
  foreign key (default_measurement_profile_id)
  references public.measurement_profiles (id) on delete set null;

-- ===========================================================================
-- Ordering & fulfillment
-- ===========================================================================

create table public.orders (
  id                       uuid primary key default gen_random_uuid(),
  customer_id              uuid not null references public.customers (user_id) on delete restrict,
  tailor_id                uuid not null references public.tailor_profiles (user_id) on delete restrict,
  garment_type_id          uuid references public.garment_types (id) on delete set null,
  status                   public.order_status not null default 'draft',
  is_test                  boolean not null default true,   -- Phase 1: pure UI/flow validation
  fabric_selections        jsonb not null default '{}',
  option_selections        jsonb not null default '{}',
  measurement_snapshot     jsonb not null default '{}',     -- frozen copy, not a live ref
  shipping_option_snapshot jsonb,                           -- frozen chosen flat-rate option
  subtotal                 bigint not null default 0,
  platform_fee             bigint not null default 0,       -- charged on item only (Phase 2)
  shipping_amount          bigint not null default 0,
  tax_amount               bigint not null default 0,       -- Phase 2 (Stripe Tax)
  total                    bigint not null default 0,
  currency                 text not null default 'USD',
  stripe_payment_intent_id text,                            -- null until Phase 2
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create index orders_customer_idx on public.orders (customer_id);
create index orders_tailor_idx   on public.orders (tailor_id);

-- The tailor's confirm/adjust step per order (before cutting).
create table public.order_measurement_reviews (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  suggested_values jsonb not null default '{}',
  note             text,
  status           public.review_status not null default 'pending',
  created_at       timestamptz not null default now()
);

create table public.shipments (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  carrier           text,
  tracking_number   text,
  tracking_url      text,
  shipped_at        timestamptz,
  est_delivery_date date,
  delivered_at      timestamptz,
  status            text,
  created_at        timestamptz not null default now()
);

create table public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  type       text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references public.orders (id) on delete cascade,
  from_user  uuid not null references public.users (id) on delete cascade,
  to_user    uuid not null references public.users (id) on delete cascade,
  body       text not null,
  media_ids  uuid[] not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  customer_id uuid not null references public.customers (user_id) on delete cascade,
  tailor_id   uuid not null references public.tailor_profiles (user_id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  body        text,
  created_at  timestamptz not null default now(),
  unique (order_id)
);

-- NOTE: payouts, disputes, finisher_profiles, alteration_jobs are Phase 2+ and
--       intentionally deferred to a later migration.

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.users                     enable row level security;
alter table public.user_roles                enable row level security;
alter table public.tailor_profiles           enable row level security;
alter table public.customers                 enable row level security;
alter table public.garment_types             enable row level security;
alter table public.measurement_fields        enable row level security;
alter table public.shop_garment_types        enable row level security;
alter table public.media                     enable row level security;
alter table public.fabrics                   enable row level security;
alter table public.garment_fabric_pricing    enable row level security;
alter table public.option_groups             enable row level security;
alter table public.option_values             enable row level security;
alter table public.samples                   enable row level security;
alter table public.shipping_options          enable row level security;
alter table public.measurement_profiles      enable row level security;
alter table public.orders                    enable row level security;
alter table public.order_measurement_reviews enable row level security;
alter table public.shipments                 enable row level security;
alter table public.order_events              enable row level security;
alter table public.messages                  enable row level security;
alter table public.reviews                   enable row level security;

-- users: a user reads/updates their own row; admins read all.
create policy users_self_read on public.users for select
  using (id = auth.uid() or public.is_admin());
create policy users_self_update on public.users for update
  using (id = auth.uid());

-- user_roles: a user can read their own roles; admins manage all.
create policy roles_self_read on public.user_roles for select
  using (user_id = auth.uid() or public.is_admin());
create policy roles_admin_write on public.user_roles for all
  using (public.is_admin()) with check (public.is_admin());

-- tailor_profiles: public read (marketplace listing); owner or admin writes.
create policy tailor_public_read on public.tailor_profiles for select using (true);
create policy tailor_owner_insert on public.tailor_profiles for insert
  with check (user_id = auth.uid() and public.has_role('tailor'));
create policy tailor_owner_update on public.tailor_profiles for update
  using (user_id = auth.uid() or public.is_admin());

-- customers: private to the owner (+ admin).
create policy customers_self_read on public.customers for select
  using (user_id = auth.uid() or public.is_admin());
create policy customers_self_upsert on public.customers for insert
  with check (user_id = auth.uid());
create policy customers_self_update on public.customers for update
  using (user_id = auth.uid());

-- garment_types & measurement_fields: public read; standard rows admin-managed,
-- custom rows owned by the tailor.
create policy gtypes_public_read on public.garment_types for select using (true);
create policy gtypes_admin_write on public.garment_types for all
  using (public.is_admin() or owner_tailor_id = auth.uid())
  with check (public.is_admin() or owner_tailor_id = auth.uid());

create policy mfields_public_read on public.measurement_fields for select using (true);
create policy mfields_write on public.measurement_fields for all
  using (public.is_admin() or owner_tailor_id = auth.uid())
  with check (public.is_admin() or owner_tailor_id = auth.uid());

-- shop_garment_types: public read; tailor manages their own rows.
create policy shop_gt_public_read on public.shop_garment_types for select using (true);
create policy shop_gt_owner_write on public.shop_garment_types for all
  using (tailor_id = auth.uid()) with check (tailor_id = auth.uid());

-- media: public read (needed to render); owner or admin writes.
create policy media_public_read on public.media for select using (true);
create policy media_owner_write on public.media for all
  using (owner_user_id = auth.uid() or public.is_admin())
  with check (owner_user_id = auth.uid());

-- Catalog tables (fabrics, pricing, options, samples, shipping): public read,
-- owning tailor writes.
create policy fabrics_public_read on public.fabrics for select using (true);
create policy fabrics_owner_write on public.fabrics for all
  using (tailor_id = auth.uid()) with check (tailor_id = auth.uid());

create policy gfp_public_read on public.garment_fabric_pricing for select using (true);
create policy gfp_owner_write on public.garment_fabric_pricing for all
  using (tailor_id = auth.uid()) with check (tailor_id = auth.uid());

create policy ogroups_public_read on public.option_groups for select using (true);
create policy ogroups_owner_write on public.option_groups for all
  using (tailor_id = auth.uid()) with check (tailor_id = auth.uid());

-- option_values: public read; writable when the parent group belongs to the tailor.
create policy ovalues_public_read on public.option_values for select using (true);
create policy ovalues_owner_write on public.option_values for all
  using (exists (select 1 from public.option_groups g
                 where g.id = option_group_id and g.tailor_id = auth.uid()))
  with check (exists (select 1 from public.option_groups g
                      where g.id = option_group_id and g.tailor_id = auth.uid()));

create policy samples_public_read on public.samples for select using (true);
create policy samples_owner_write on public.samples for all
  using (tailor_id = auth.uid()) with check (tailor_id = auth.uid());

create policy shipping_public_read on public.shipping_options for select using (true);
create policy shipping_owner_write on public.shipping_options for all
  using (tailor_id = auth.uid()) with check (tailor_id = auth.uid());

-- measurement_profiles: private to the owning customer (+ admin).
create policy mprofiles_owner_read on public.measurement_profiles for select
  using (customer_id = auth.uid() or public.is_admin());
create policy mprofiles_owner_write on public.measurement_profiles for all
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- orders: the owning customer, the order's tailor, or an admin.
create policy orders_party_read on public.orders for select
  using (customer_id = auth.uid() or tailor_id = auth.uid() or public.is_admin());
create policy orders_customer_insert on public.orders for insert
  with check (customer_id = auth.uid());
create policy orders_party_update on public.orders for update
  using (customer_id = auth.uid() or tailor_id = auth.uid() or public.is_admin());

-- Helper predicate for order-scoped children: is the current user a party to the order?
-- (Inlined per-table to keep policies self-contained.)
create policy omr_party_read on public.order_measurement_reviews for select
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.customer_id = auth.uid() or o.tailor_id = auth.uid() or public.is_admin())));
create policy omr_tailor_write on public.order_measurement_reviews for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.tailor_id = auth.uid()));
create policy omr_customer_respond on public.order_measurement_reviews for update
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));

create policy shipments_party_read on public.shipments for select
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.customer_id = auth.uid() or o.tailor_id = auth.uid() or public.is_admin())));
create policy shipments_tailor_write on public.shipments for all
  using (exists (select 1 from public.orders o where o.id = order_id and o.tailor_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.tailor_id = auth.uid()));

create policy events_party_read on public.order_events for select
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.customer_id = auth.uid() or o.tailor_id = auth.uid() or public.is_admin())));

create policy messages_party_read on public.messages for select
  using (from_user = auth.uid() or to_user = auth.uid() or public.is_admin());
create policy messages_sender_write on public.messages for insert
  with check (from_user = auth.uid());

create policy reviews_public_read on public.reviews for select using (true);
create policy reviews_customer_write on public.reviews for insert
  with check (customer_id = auth.uid());
