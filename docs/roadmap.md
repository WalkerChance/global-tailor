# Global Tailor — Roadmap

Sequenced around **trust and liquidity**, not feature count. Each phase should
be shippable and teach you something before the next.

**Fixed constraints for all phases:** mobile-first / iPhone-first web; **US
customers only** at launch (schema built to scale beyond the US); Stripe for
payments + tax.

## Phase 0 — Foundations & decisions (before writing much code)
- **Run the US tax + break-even research in a separate chat** (see
  [`open-questions.md`](open-questions.md)): US marketplace-facilitator
  sales-tax obligations, and the take-rate vs. tax+processing break-even that
  sets the fee. Pair with a lawyer for US ToS/refund posture.
- Lock MVP scope for the **US corridor** (tailors anywhere → US customers).
- Set up Stripe Connect + Stripe Tax, Supabase project, Next.js app skeleton
  (mobile-first), CI, environments.
- **Seed with the committed test tailor.** Ingest his measurement videos, cuts,
  and material photos as the first shop's real data (unpaid test — no fees).
  This is the baseline for the configurator, the tiles pipeline, and the
  measurement UX.
- **Then recruit a handful more tailors by hand.** Supply-first; concierge-
  onboard (you build their shop with them). No marketplace works empty.

## Phase 1 — MVP: a working, trusted transaction
Goal: a real customer configures a real garment from a real tailor, pays, and
receives it, with the platform holding funds safely.

Must-haves:
- **Role-based auth** (customer / tailor / admin) with Supabase Auth + RLS,
  scaffolded from day one; tailor and admin surfaces gated behind a flag until
  ready.
- Tailor onboarding + verification + Stripe Connect KYC.
- Shop pages: profile, samples, fabric library (with **photo→tile** normalized
  swatches), cut/option definitions, structured pricing.
- **Tailor shipping options** (carrier + speed + price) and, post-ship,
  **tracking-number entry**.
- Discovery: browse by shop / cut / material, with basic filters + SSR for SEO.
- **Garment configurator** with live pricing, turnaround estimate, and
  **customer-selected shipping speed**.
- **Guided manual measurement wizard** + reusable measurement profile (informed
  by the test tailor's videos).
- Checkout via **Stripe (fee + US sales tax via Stripe Tax) + staged/held
  payout**.
- Order management + customer↔tailor messaging + status updates + shipment
  tracking.
- Basic dispute/refund handling (can be **human-operated** behind the scenes).
- Reviews after delivery.
- Legally reviewed US ToS, refund/remake policy, and clear "duties may apply at
  delivery" disclosure at checkout.

Explicitly deferred: AR, local finishers as a product, native apps, automated
disputes, non-US markets/multi-currency.

## Phase 1.5 — Fit confidence
- Tailor **reviews/queries measurements before cutting** (biggest failure-mode
  reducer).
- Measurement-from-existing-garment option.
- Defined **fit guarantee / remake** flow funded by the held payout.
- Concierge **local-finisher** referrals (curated list + human coordination) —
  test demand before building the marketplace.

## Phase 2 — Scale liquidity & reduce ops load
- Onboard tailors self-serve (with automated verification steps).
- Better search (dedicated engine + faceting) as catalog grows.
- Semi-automated dispute workflow with evidence capture.
- **First international market beyond the US** (UK or EU): enable currency, VAT/
  IOSS via Stripe Tax, and market ToS — this is where the scale-ready schema
  pays off. Repeat the Phase 0 legal/tax research for that market.
- Carrier tracking automation (webhook-driven delivery status vs. manual entry).
- Notifications (email/SMS), saved configurations, wishlists, reorders.
- Analytics on the funnel, especially measurement-completion drop-off.

## Phase 3 — Differentiators
- **AR / photo-based measurement** (evaluate 3rd-party SDKs vs. build).
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
1. Scaffold Next.js (mobile-first) + Supabase + Stripe test mode; **auth +
   roles (user_roles) + RLS** wired from the start.
2. Data model migrations for users/roles, shops, fabrics (+ `media`), option
   groups, garment types, shipping options.
3. Tailor shop editor (profile + one garment type + fabrics + options +
   pricing + shipping options) — seed it with the test tailor's real data.
4. Photo→tile ingestion for his material photos (AI normalize + human confirm).
5. Public shop page + one configurator flow incl. shipping-speed choice (no
   payment yet) — get the core loop visible and testable end to end on an
   iPhone before wiring money.
