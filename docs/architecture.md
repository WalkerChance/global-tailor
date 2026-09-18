# Global Tailor — Technical Architecture

This is a recommended starting architecture optimized for a small team shipping
an MVP fast, with room to grow. Nothing here is load-bearing forever; it's a
sensible default, and alternatives are noted.

> **Guiding constraints (from product direction):**
> - **Mobile-first, iPhone-first.** The primary experience is a phone browser
>   (Safari/iOS). Design and test at iPhone widths first; desktop is the
>   enhancement, not the reverse. See §8.
> - **US-only at launch, built to scale internationally.** Every schema and
>   flow (currency, country, tax, shipping) is modeled to *support* other
>   markets, but only the US corridor is enabled in v1. Don't hardcode
>   "US-only" assumptions that a later market would have to unwind.
> - **Build order: app + auth + the loop first, payments/tax second.** Phase 1
>   proves the whole configure-and-order loop with a **test order (no money)**;
>   Stripe payments + Stripe Tax are wired in Phase 2 once the loop is
>   validated. Auth/roles are the very first thing built.

## 1. Stack recommendation

| Layer | Recommendation | Why / alternatives |
|---|---|---|
| Frontend | **Next.js (App Router) + React + TypeScript**, Tailwind CSS, **mobile-first / PWA-ready** | SEO matters for shop discovery (SSR/ISR); one framework for marketing + app. Responsive web on iPhone first; a PWA install path before any native app. |
| Hosting | **Vercel** | First-class Next.js, previews, edge. Alt: any Node host. |
| Backend/API | Next.js route handlers / server actions to start; extract services later | Avoid premature microservices. |
| Database + Auth + Storage | **Supabase (Postgres + Auth + Storage + RLS)** | One managed platform: relational data (essential for the configurator), auth, image storage, row-level security. Alt: separate Postgres + Auth0 + S3. |
| Payments | **Stripe Connect + Stripe Tax** (US sales tax at launch) | The standard for marketplace pass-through payouts, KYC, held funds, split payments. Tax handled by Stripe; the *what/where* is a separate research workstream (see §3 + open questions). |
| Media | Supabase Storage or a dedicated image CDN (Cloudinary/imgix) | Fabric/garment photos are the product — need transforms, optimization. Store URLs/links in DB, not blobs. See §4. |
| AI (photo → "tiles") | Vision model to normalize tailor-supplied material photos into clean selection tiles + extracted attributes | Turns messy real-world inputs (our test tailor's photos) into a consistent swatch UI. See §4. |
| Search | Postgres full-text + filters to start; **Typesense/Meilisearch** when facets grow | Don't reach for Elasticsearch on day one. |
| Messaging | Postgres-backed threads + Supabase Realtime | Customer↔tailor chat. Email/notification fallback. |
| Transactional email/SMS | Resend/Postmark + Twilio (later) | Order updates, disputes. |
| Background jobs | Supabase cron / a queue (later) | Payout release, reminders, webhooks. |

**Principle:** boring, managed, relational. The domain is inherently
relational (shops → fabrics → options → orders → measurements → payouts); a
document store would fight you.

## 2. Data model (first cut)

Core entities and key relationships. Names illustrative.

```
users                      (identity — maps to Supabase auth.users)
  id, email, name, locale, country, created_at
  -- role is NOT a column here; see user_roles (a user can hold >1 role)

user_roles                 (role-based access, scalable)
  user_id, role(customer|tailor|admin|finisher), granted_at, granted_by
  -- one row per (user, role). Drives auth/authorization + RLS. See §2.1.

tailor_profiles            (1:1 users holding role=tailor)
  user_id, shop_name, slug, bio, location_country, location_city,
  languages[], turnaround_days, verification_status, stripe_account_id, rating_avg

customers                  (the customer profile — reusable across orders)
  user_id,
  display_name, phone,                   -- name + contact (name/email also on users)
  shipping_addresses(json),              -- one or more saved addresses
  default_address_id,
  default_measurement_profile_id (nullable),
  stripe_customer_id (nullable),         -- for SAVED payment methods (Phase 2+)
  preferences(json, nullable)            -- style/fit/comms prefs — POST-MVP
  -- profile stores name, contact, address(es), and links to saved measurements
  --   so a returning customer doesn't re-enter anything. Preferences are later.
  -- SAVED CARDS ARE NEVER STORED HERE. We keep only stripe_customer_id; card
  --   data lives on Stripe. Non-sensitive display (brand/last-4/expiry) can be
  --   cached read-only from Stripe. See §3.

garment_types              (taxonomy; standard now, custom later)
  id, name, base_measurement_schema(json),
  is_standard(bool),                     -- suit|shirt|pants = true at launch
  owner_tailor_id (nullable)             -- set when a tailor adds a CUSTOM type (later)
  -- launch enables 3 standard types (suits, shirts, pants). Custom types are
  --   just rows with owner_tailor_id set — no schema change needed later.

shop_garment_types         (which types a shop offers — the shop's selection)
  tailor_id, garment_type_id, active
  -- garment type is a selectable config when setting up a shop

measurement_fields         (extensible measurement schema per garment type)
  id, garment_type_id, key, label, unit, required, sort,
  owner_tailor_id (nullable)             -- null = standard field; set = tailor-CUSTOM (later)
  -- launch uses the standard fields; a tailor's custom asks are added rows later.
  --   AR later writes into these same fields.

media                      (single source of truth for all images/video)
  id, owner_user_id, kind(fabric|garment|sample|measurement_video|evidence|other),
  storage_path, public_url, mime_type, width, height, alt_text,
  ai_status(none|pending|done|failed), created_at
  -- store URLs/links, not blobs. Every photo the tailor gives us lands here.

fabrics                    (belongs to a tailor)
  id, tailor_id, name, composition, weight_gsm, color, pattern,
  price_tier, price_amount, currency, availability,
  source_media_id (raw photo),           -- what the tailor uploaded
  tile_media_id (nullable),              -- clean, normalized "tile" for the picker
  ai_attributes(json)                    -- vision-extracted color/pattern/material
  -- "tile" = the swatch shown in the material selector (see §4.3)

garment_fabric_pricing     (type→material pricing tie-through; scalable)
  id, tailor_id, garment_type_id, fabric_id,
  price_amount (nullable),               -- explicit price for this fabric IN this garment
  yardage_factor (nullable)              -- OR compute from fabric price × how much this type needs
  -- MVP can ignore this table (flat per-type base + flat per-fabric price).
  --   It exists so price can depend on BOTH the garment type and the material
  --   (a suit uses more fabric than a shirt) without a later schema change.

option_groups              (belongs to a tailor + garment_type)  e.g. "Lapel"
  id, tailor_id, garment_type_id, name, required, multi_select
option_values              (belongs to option_group)             e.g. "Peak"
  id, option_group_id, name, price_modifier, media_id (nullable)

samples                    (portfolio items, belongs to tailor)
  id, tailor_id, garment_type_id, title, description, media_ids[]

shipping_options           (per tailor: flat-rate options THEY set & quote)
  id, tailor_id, label, carrier(optional, e.g. DHL),
  base_price,                            -- flat price for the first item
  additional_item_price (nullable),      -- flat add per extra item
  per_item_type_pricing (json, nullable),-- optional flat rates keyed by item type
  min_days, max_days, currency, destination_countries[], active
  -- tailor owns & quotes shipping (flat, by item count/type). NOT live carrier
  --   rates. Customer picks one at checkout; the total is frozen onto the order.

measurement_profiles       (belongs to customer, reusable, lives on the profile)
  id, customer_id, label, garment_type_id, values(json),
  source(manual|garment|video|ar), source_media_id (nullable),
  last_confirmed_at
  -- reusable across orders. In the order loop the customer CONFIRMS or ADJUSTS
  --   this against the tailor's guidance rather than entering from scratch.

order_measurement_reviews  (the tailor's confirm/adjust step per order)
  id, order_id, proposed_by(tailor), suggested_values(json), note,
  status(pending|customer_accepted|customer_declined), created_at
  -- the tailor can review the submitted measurements and propose adjustments;
  --   the customer accepts/declines before the tailor cuts. See product-plan §5.

orders
  id, customer_id, tailor_id, garment_type_id, status,
  is_test(bool),                         -- true = pure UI/flow validation, no
                                         --   payment and NO tailor engagement
  fabric_selections(json), option_selections(json),
  measurement_snapshot(json),            -- snapshot, not a live reference
  shipping_option_snapshot(json),        -- chosen flat-rate option, frozen
  subtotal, platform_fee, shipping_amount, tax_amount, total, currency,
  stripe_payment_intent_id (nullable),   -- null until payments (Phase 2)
  created_at

shipments                  (fulfillment: tailor-entered tracking)
  id, order_id, carrier, tracking_number, tracking_url,
  shipped_at, est_delivery_date, delivered_at, status
  -- tailor plugs in the tracking number after drop-off; drives delivery status
  --   and (with fit-confirm) the final payout release

order_events               (status history / audit)
  id, order_id, type, payload(json), created_at

payouts
  id, order_id, tailor_id, stripe_transfer_id, amount, status(held|released|reversed), released_at

messages
  id, order_id(nullable), from_user, to_user, body, media_ids[], created_at

reviews
  id, order_id, customer_id, tailor_id, rating, body, created_at

disputes
  id, order_id, opened_by, reason, status, resolution, evidence(json), created_at

finisher_profiles          (local alteration tailors)
  id, user_id, city, country, services[], rating_avg

alteration_jobs
  id, order_id, finisher_id, status, cost, funded_by(platform|customer|split)
```

### 2.1 Role-based auth (build the scaffolding now, enable later)

Authentication and authorization are **role-based from day one**, even though
the full multi-role experience is switched on only once the core app works.
Getting this into the foundation is far cheaper than retrofitting it.

- **Roles:** `customer`, `tailor`, `admin` at launch; `finisher` reserved for
  the local-alteration network later.
- **Model roles in their own table** (`user_roles`), not as a single column on
  `users`. A person may legitimately be both a customer and a tailor; admins
  are just users with the `admin` role. This avoids a painful migration later.
- **One auth system, Supabase Auth**, with role claims surfaced into the JWT
  (via a custom access-token hook) so both the app and Postgres **RLS**
  policies can authorize by role.
- **RLS enforces it in the database:** a tailor can read/write only their own
  shop, fabrics, options, and orders; a customer only their own orders and
  measurements; an admin has elevated policies. Enforce at the DB layer so a
  bug in app code can't leak another shop's data.
- **Route/layout gating in Next.js:** role-aware layouts (`/shop/*` tailor
  console, `/account/*` customer, `/admin/*`) behind middleware that checks the
  role claim. Ship the customer flow first; keep the tailor and admin routes
  behind a flag until enabled.
- **Transferable/scalable:** because roles are data (not hardcoded branches),
  adding `finisher` or a future `wholesale_buyer` is a row + policies, not a
  refactor.

**Design notes**
- **Extensible by design, minimal at launch.** Garment types, measurement
  fields, and the type→material pricing tie-through are all modeled as *data*
  (`is_standard`/`owner_tailor_id`, `measurement_fields`,
  `garment_fabric_pricing`) so that later phases — custom garments, custom
  measurements, fabric-consumption pricing, AR — are new rows, not migrations.
  The MVP enables only the standard subset.
- **Snapshot the order.** `orders` stores a *copy* of the chosen fabrics,
  options, prices, and measurements at purchase time. Never render an order
  from live fabric/option rows — the tailor may change prices or retire a
  fabric later, and disputes require the frozen spec.
- **Money as integer minor units + currency code**, everywhere. Never floats.
- **US-only launch, scale-ready schema.** Prices, tax, and shipping carry a
  `currency` and country from day one even though only USD/US is enabled. Don't
  bake "always USD / always US" into logic — gate it with config/feature flags
  so a second market is data, not a rewrite.
- **Multi-currency (later):** tailors may eventually price in their currency or
  a settlement currency; decide the FX/display policy when the second market
  arrives (see open questions). For US launch, settle in USD.
- **RLS from the start** (Supabase), driven by `user_roles`: a tailor sees only
  their shop/orders; a customer only their own; admins have elevated policies.
  Get this right before any real data exists.

## 3. Payment flow (Stripe Connect)

Goal: customer pays once; platform takes its fee; tailor gets paid, but not all
of it instantly (fulfillment risk).

Recommended shape:
1. Tailor onboards via **Stripe Connect** (Express or Custom) → KYC/payout
   handled by Stripe, `stripe_account_id` stored.
2. Customer checks out → **PaymentIntent** with `application_fee_amount`
   (the platform's cut). Use **separate charges & transfers** (or destination
   charges with a delay) so the platform controls *when* the tailor is paid.
3. **Hold / stage the payout.** Do **not** pay the tailor on capture. Release:
   - a portion when the tailor accepts/starts the order, and
   - the remainder on delivery/fit-confirmation (or auto-release after N days).
   This is implemented with delayed/manual `Transfer`s, funded from the held
   balance. This staged release is the escrow-like mechanism that underpins
   trust & disputes (product-plan §7).
4. **Refunds/disputes** reverse un-released transfers first; the held portion is
   the buffer.
5. **Webhooks** drive order state (payment succeeded, dispute opened, transfer
   paid). Handle idempotently.
6. **Shipping in the total.** The customer's chosen `shipping_option`
   (carrier + speed, from what the tailor enabled) adds `shipping_amount` to
   the PaymentIntent. The shipping fee flows to the tailor (who actually ships)
   as part of their transfer, not the platform's fee base — decide this
   explicitly so the take rate isn't quietly charged on shipping.
7. **Tax (US sales tax at launch, via Stripe Tax).** Stripe Tax computes and
   collects `tax_amount` at checkout. **Whether/where** the platform must
   collect (marketplace-facilitator rules by state) is a **separate research
   workstream** — do it in a dedicated chat and compute the break-even of
   take-rate vs. tax/processing cost before setting the fee. Architect the
   PaymentIntent so the tax line is already present (US) and extends to
   VAT/IOSS later without reworking the flow.

8. **Saved payment methods (Phase 2+).** Create a **Stripe Customer** per
   customer (`stripe_customer_id`) and attach cards with a **SetupIntent** so a
   returning customer checks out in one tap. **We never touch or store raw card
   data** — it lives on Stripe (PCI scope stays minimal via Stripe Elements /
   hosted fields); we cache only non-sensitive display (brand, last-4, expiry).
   At checkout, the PaymentIntent references the saved payment method **on the
   platform account**, with the staged transfers to the tailor's connected
   account as above.

**Fees & break-even:** card + Connect + Stripe Tax fees eat into a "small %"
take rate. The take rate must be set *after* the tax/fee research, not before.
Until then, treat the rate as a placeholder (see open questions).

## 4. Media handling & the "tiles" pipeline

### 4.1 Storage
- Fabric and garment images are the product. Store **originals in object
  storage** (Supabase Storage / CDN) and keep only **URLs/links in the DB**
  (the `media` table) — never blobs in Postgres.
- Serve via CDN with on-the-fly transforms; generate responsive/optimized
  variants; lazy-load. Optimize hard for mobile/iPhone bandwidth.
- Color-accuracy guidance for fabrics (screens lie) — a "colors may vary /
  request a swatch" affordance is a real trust feature.

### 4.2 Everything the tailor gives us becomes a `media` row
Our test tailor supplied **measurement videos, cut references, and material
photos** in raw form (see product-plan §5.1). Each lands as a `media` row with
a `kind`, so measurement videos, sample garments, and fabric photos are all
addressable, linkable, and surfaced in-app from one place.

### 4.3 Photo → "tile" AI translation
Raw material photos aren't a clean UI. A **"tile"** is the normalized swatch
shown in the material selector. Pipeline:
1. Tailor uploads a raw fabric photo → `media` row (`ai_status=pending`).
2. A vision model (async job) crops/normalizes it into a clean, consistent
   swatch tile and **extracts attributes** (dominant color, pattern type,
   apparent material/weave) into `fabrics.ai_attributes`.
3. Output tile stored as its own `media` row, referenced by
   `fabrics.tile_media_id`; `ai_status=done`.
4. **Human-in-the-loop:** the tailor (or an admin) confirms/edits the extracted
   attributes and the tile before it goes live — AI proposes, human approves.
   Never publish an unreviewed AI tile as fact about a real product.
This gives a uniform material-selection grid regardless of how messy the
source photos were, and the extracted attributes power "shop by material."

## 5. Search & discovery

- v1: Postgres — filter shops/samples/fabrics by garment_type, material,
  price, region, turnaround, rating. Add GIN indexes for full-text + arrays.
- Later: a dedicated search engine (Typesense/Meilisearch) when faceted search
  across fabrics/tailors gets heavy or slow.
- SEO: server-render shop and sample pages (great for organic discovery — a
  real acquisition channel for this business).

## 6. Environments, security, ops

- Separate Supabase projects / Stripe keys per environment (dev/staging/prod).
- Secrets in the host's env store; never in the repo.
- PII: measurements + addresses are personal data. US launch → US state
  privacy laws (e.g. CCPA/CPRA) apply; build the deletion path + minimal
  retention now so GDPR/UK-GDPR are a config away when EU/UK go live.
- Audit trail on orders, payouts, and disputes (`order_events`) — you'll need
  it for chargebacks and support.
- Observability: error tracking (Sentry), payment-webhook alerting.

## 7. What NOT to build yet

- Native iOS/Android apps — **mobile-first responsive web (iPhone) + PWA**
  first; a native app only if the web PWA proves limiting.
- The AR measurement tool (integrate/evaluate later — measurement wizard first).
- A full second marketplace for local finishers (concierge/manual first).
- Non-US markets, multi-currency FX, VAT/IOSS — schema is ready for them, but
  don't *enable* them in v1.
- Microservices, custom search infra, multi-region DB. All premature.
