# Global Tailor — Roadmap

Sequenced around **validating the product first, then wiring the money.** Build
and prove the app + auth + the configure-and-order loop works end to end, *then*
add payments and tax. Each phase should be shippable and teach you something
before the next.

**Fixed constraints for all phases:** mobile-first / iPhone-first web; **US
customers only** at launch (schema built to scale beyond the US); Stripe for
payments + tax (added in Phase 2, not Phase 1).

## Phase 0 — Foundations
- Lock MVP scope for the **US corridor** (tailors anywhere → US customers) and
  the **three launch garment types: suits, shirts, pants** (see product-plan
  §3.4). Pants behave identically standalone or as part of a suit.
- Set up Supabase project, Next.js app skeleton (mobile-first), CI, environments.
- **Seed with the committed test tailor.** Ingest his measurement videos, cuts,
  and material photos as the first shop's real data (unpaid test — no fees).
  He shared only a subset, via photos, so expect a categorization pass. This is
  the baseline for the configurator, the tiles pipeline, and the measurement UX.
- Kick off the **US tax + break-even research in a separate chat** now so it's
  ready by the time Phase 2 needs it — but it does **not** block Phase 1.

## Phase 1 — App + auth + the core loop (validate it works, no real money)
Goal: on an iPhone, a user signs in, a tailor's real shop is browsable, and a
customer can configure a garment (type → material → options → measurements →
shipping choice) and place a **test order** — proving the whole loop before a
cent moves.

Must-haves:
- **Role-based auth** (customer / tailor / admin) with Supabase Auth + RLS —
  the first thing built, so everything sits on it correctly.
- Tailor shop setup: profile, **selectable garment types** (suits/shirts/pants),
  samples, fabric library (with **photo→tile** normalized swatches), cut/option
  definitions, structured pricing, and **flat-rate shipping by item
  count/type**.
- Discovery: browse by shop / cut / material, with basic filters + SSR for SEO.
- **Garment configurator** with live pricing, **type→material pricing
  tie-through** (see product-plan §4), turnaround estimate, and customer-
  selected shipping option.
- **Standardized measurement wizard** per garment type + reusable measurement
  profile (informed by the test tailor's videos).
- Order object + status flow + customer↔tailor messaging — created as a **test
  order** to exercise the loop. This is **purely UI/flow validation: no charge
  and no tailor engagement** (the tailor does not cut cloth or act on it).
- Admin surface (basic): verify tailors, moderate media/tiles.

Explicitly deferred to later phases: real payments, tax, AR, local finishers,
native apps, custom garments/measurements, non-US markets.

## Phase 2 — Payments, tax & the trusted transaction
Goal: turn the validated loop into a real, money-moving, trust-backed purchase.
- **US tax + break-even decision** finalized (from the Phase 0 research) → sets
  the take rate.
- Tailor **Stripe Connect** onboarding + KYC.
- Checkout via **Stripe (fee + US sales tax via Stripe Tax) + staged/held
  payout** (partial on acceptance, remainder on delivery/fit-confirm).
- **Tracking-number entry** by the tailor post-ship → drives delivery status and
  final payout release.
- Basic dispute/refund handling (can be **human-operated** behind the scenes).
- Reviews after delivery.
- Legally reviewed US ToS, refund/remake policy, and clear "duties may apply at
  delivery" disclosure at checkout.

## Phase 2.5 — Fit confidence
- Tailor **reviews/queries measurements before cutting** (biggest failure-mode
  reducer).
- Measurement-from-existing-garment option.
- Defined **fit guarantee / remake** flow funded by the held payout.
- Concierge **local-finisher** referrals (curated list + human coordination) —
  test demand before building the marketplace.

## Phase 3 — Scale liquidity & reduce ops load
- Onboard tailors self-serve (with automated verification steps).
- Better search (dedicated engine + faceting) as catalog grows.
- Semi-automated dispute workflow with evidence capture.
- **First international market beyond the US** (UK or EU): enable currency, VAT/
  IOSS via Stripe Tax, and market ToS — this is where the scale-ready schema
  pays off. Repeat the Phase 0 legal/tax research for that market.
- Carrier tracking automation (webhook-driven delivery status vs. manual entry).
- Notifications (email/SMS), saved configurations, wishlists, reorders.
- Analytics on the funnel, especially measurement-completion drop-off.

## Phase 4 — Differentiators & full customization
- **Custom garments/designs:** tailors define their own item types beyond
  suits/shirts/pants, with full custom option sets.
- **Custom measurements:** tailors add their own measurement asks (beyond the
  standardized set) that make their output better — the same measurement model
  that later feeds AR.
- **AR / photo-based measurement** (evaluate 3rd-party SDKs vs. build), wired
  into the (now extensible) measurement schema.
- **Local finisher network as a real product** (directory, booking, payment).
- Tailor-side tooling: production dashboards, bulk fabric upload, promotions.
- Loyalty / repeat-purchase mechanics (the real LTV lever).
- Possibly: platform-arranged logistics or a DDP option *if* the tax/legal
  posture is deliberately changed (a strategic decision, not a default).

## Cross-cutting, every phase
- Mobile-first: every screen designed/tested at iPhone width first.
- Unit economics: keep take rate ahead of payment + tax + support cost.
- Trust metrics: dispute rate, remake rate, completion rate.
- Legal/tax review whenever entering a new market.

## A sensible first two weeks (if you want to start building now)
Payments come later — these two weeks are all about proving the app + auth +
loop.
1. Scaffold Next.js (mobile-first) + Supabase; **auth + roles (user_roles) +
   RLS** wired from the very start — build this first.
2. Data model migrations for users/roles, shops, fabrics (+ `media`), option
   groups, garment types (suits/shirts/pants), flat-rate shipping.
3. Tailor shop editor (profile + selectable garment types + fabrics + options +
   pricing + flat-rate shipping) — seed it with the test tailor's real data.
4. Photo→tile ingestion for his material photos (AI normalize + human confirm).
5. Public shop page + one configurator flow (type → material w/ pricing tie-
   through → options → measurements → shipping choice), ending in a **test
   order (no payment)** — the whole loop, testable on an iPhone. Stripe gets
   wired in Phase 2 once this is proven.
