# Global Tailor — Technical Architecture

This is a recommended starting architecture optimized for a small team shipping
an MVP fast, with room to grow. Nothing here is load-bearing forever; it's a
sensible default, and alternatives are noted.

## 1. Stack recommendation

| Layer | Recommendation | Why / alternatives |
|---|---|---|
| Frontend | **Next.js (App Router) + React + TypeScript**, Tailwind CSS | SEO matters for shop discovery (SSR/ISR); one framework for marketing + app. |
| Hosting | **Vercel** | First-class Next.js, previews, edge. Alt: any Node host. |
| Backend/API | Next.js route handlers / server actions to start; extract services later | Avoid premature microservices. |
| Database + Auth + Storage | **Supabase (Postgres + Auth + Storage + RLS)** | One managed platform: relational data (essential for the configurator), auth, image storage, row-level security. Alt: separate Postgres + Auth0 + S3. |
| Payments | **Stripe Connect** (+ Stripe Tax when tax is in scope) | The standard for marketplace pass-through payouts, KYC, held funds, split payments. See §3. |
| Media | Supabase Storage or a dedicated image CDN (Cloudinary/imgix) | Fabric/garment photos are the product — need transforms, optimization. |
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
users
  id, role(customer|tailor|admin|finisher), email, name, locale, country, created_at

tailor_profiles            (1:1 users where role=tailor)
  user_id, shop_name, slug, bio, location_country, location_city,
  languages[], turnaround_days, verification_status, stripe_account_id, rating_avg

customers
  user_id, default_shipping_address, measurement_profile_id (nullable)

garment_types              (platform taxonomy, shared)
  id, name(suit|shirt|trousers|...), base_measurement_schema (json)

fabrics                    (belongs to a tailor)
  id, tailor_id, name, composition, weight_gsm, color, pattern,
  price_tier, price_amount, currency, availability, images[]

option_groups              (belongs to a tailor + garment_type)  e.g. "Lapel"
  id, tailor_id, garment_type_id, name, required, multi_select
option_values              (belongs to option_group)             e.g. "Peak"
  id, option_group_id, name, price_modifier

samples                    (portfolio items, belongs to tailor)
  id, tailor_id, garment_type_id, title, description, images[]

measurement_profiles       (belongs to customer, reusable)
  id, customer_id, label, garment_type_id, values(json), source(manual|garment|ar)

orders
  id, customer_id, tailor_id, garment_type_id, status,
  fabric_selections(json), option_selections(json),
  measurement_snapshot(json),           -- snapshot, not a live reference
  price_breakdown(json), subtotal, platform_fee, shipping_amount, total, currency,
  stripe_payment_intent_id, created_at

order_events               (status history / audit)
  id, order_id, type, payload(json), created_at

payouts
  id, order_id, tailor_id, stripe_transfer_id, amount, status(held|released|reversed), released_at

messages
  id, order_id(nullable), from_user, to_user, body, attachments[], created_at

reviews
  id, order_id, customer_id, tailor_id, rating, body, created_at

disputes
  id, order_id, opened_by, reason, status, resolution, evidence(json), created_at

finisher_profiles          (local alteration tailors)
  id, user_id, city, country, services[], rating_avg

alteration_jobs
  id, order_id, finisher_id, status, cost, funded_by(platform|customer|split)
```

**Design notes**
- **Snapshot the order.** `orders` stores a *copy* of the chosen fabrics,
  options, prices, and measurements at purchase time. Never render an order
  from live fabric/option rows — the tailor may change prices or retire a
  fabric later, and disputes require the frozen spec.
- **Money as integer minor units + currency code**, everywhere. Never floats.
- **Multi-currency:** tailors may price in their currency or a settlement
  currency; decide the FX/display policy early (see open questions).
- **RLS from the start** (Supabase): a tailor sees only their shop/orders; a
  customer sees only their orders; admins see all. Get this right before any
  real data exists.

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
6. **Tax:** if/when marketplace-facilitator sales tax or VAT is in scope,
   **Stripe Tax** can compute/collect at checkout — but *whether* you must is a
   legal question, not a technical one (open questions). Architect the
   PaymentIntent so a tax line can be added without reworking the flow.

**Currency & fees:** cross-border card + FX + Connect fees are non-trivial and
eat into a "small %" take rate. Model unit economics before setting the rate.

## 4. Media handling

- Fabric and garment images are the core UX. Enforce upload guidelines (min
  resolution, neutral background for fabrics), generate responsive/optimized
  variants, lazy-load.
- Store originals in object storage; serve via CDN with on-the-fly transforms.
- Consider color-accuracy guidance for fabrics (screens lie) — a known trust
  gap in online tailoring; a "colors may vary / request a swatch" affordance
  helps.

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
- PII: measurements + addresses are personal data — GDPR/UK-GDPR apply given
  EU/UK customers. Data-processing records, deletion path, minimal retention.
- Audit trail on orders, payouts, and disputes (`order_events`) — you'll need
  it for chargebacks and support.
- Observability: error tracking (Sentry), payment-webhook alerting.

## 7. What NOT to build yet

- Native mobile apps (responsive web first).
- The AR measurement tool (integrate/evaluate later — measurement wizard first).
- A full second marketplace for local finishers (concierge/manual first).
- Microservices, custom search infra, multi-region DB. All premature.
