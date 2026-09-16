# Global Tailor — Roadmap

Sequenced around **trust and liquidity**, not feature count. Each phase should
be shippable and teach you something before the next.

## Phase 0 — Foundations & decisions (before writing much code)
- Resolve the blocking legal/tax/payments questions in
  [`open-questions.md`](open-questions.md) with a tax advisor and a lawyer for
  the *first* target market only (pick one: probably US **or** UK to start).
- Lock MVP scope and the first target *corridor* (e.g. tailors in one region →
  customers in one country). A narrow corridor makes shipping, tax, and support
  tractable.
- Set up Stripe Connect account, Supabase project, Next.js app skeleton, CI,
  environments.
- **Recruit 5–15 real tailors by hand.** Supply-first. No marketplace works
  empty. Concierge-onboard them (you build their shop with them).

## Phase 1 — MVP: a working, trusted transaction
Goal: a real customer configures a real garment from a real tailor, pays, and
receives it, with the platform holding funds safely.

Must-haves:
- Tailor onboarding + verification + Stripe Connect KYC.
- Shop pages: profile, samples, fabric library, cut/option definitions,
  structured pricing.
- Discovery: browse by shop / cut / material, with basic filters + SSR for SEO.
- **Garment configurator** with live pricing and turnaround estimate.
- **Guided manual measurement wizard** + reusable measurement profile.
- Checkout via Stripe with platform fee + **staged/held payout**.
- Order management + customer↔tailor messaging + status updates.
- Basic dispute/refund handling (can be **human-operated** behind the scenes).
- Reviews after delivery.
- Legally reviewed ToS, refund/remake policy, and clear "duties may apply at
  delivery" disclosure at checkout.

Explicitly deferred: AR, local finishers as a product, native apps, automated
disputes, multi-corridor.

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
- Second corridor / second target market (repeat the Phase 0 legal work).
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
- Unit economics: keep take rate ahead of payment + FX + support cost.
- Trust metrics: dispute rate, remake rate, completion rate.
- Legal/tax review whenever entering a new market.

## A sensible first two weeks (if you want to start building now)
1. Scaffold Next.js + Supabase + Stripe test mode; auth + roles + RLS.
2. Data model migrations for shops, fabrics, option groups, garment types.
3. Tailor shop editor (profile + one garment type + fabrics + options + pricing).
4. Public shop page + one configurator flow (no payment yet) — get the core
   loop visible and testable end to end before wiring money.
