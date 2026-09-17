# Global Tailor — Open Questions & Decisions

Resolve the **blocking** ones (⛔) before launch/revenue. The rest can be
decided as you build. Owners/answers to be filled in.

**Decided (this round):** Stripe for payments + tax · US customers only at
launch (scale-ready schema) · mobile-first / iPhone-first web · role-based auth
(customer/tailor/admin, scaffold now) · a committed unpaid test tailor is the
seed dataset · customer-selected shipping speed from tailor-enabled options +
tailor-entered tracking.

## ⛔ The dedicated US tax + break-even workstream (separate chat)
This is its own research task, not a bullet to hand-wave:
1. **US marketplace-facilitator sales tax:** In which US states is the
   *platform* obligated to collect/remit sales tax on these sales even though
   the tailor is the seller and ships from abroad? (Likely yes in several
   states, independent of who the importer is.) Map obligations + how Stripe Tax
   registers/remits.
2. **Take-rate vs. tax + processing break-even:** model the full stack — Stripe
   processing, cross-border/card, Stripe Tax, refunds/chargebacks, support —
   and find the take rate that clears cost with margin. **The fee is set from
   this, not guessed.**
3. **Import duties posture (confirm, not research):** customer as **importer of
   record**, DDU shipping, duties billed by carrier on delivery — confirm
   workable and disclose clearly at checkout. This is the part to keep off the
   platform's books for now.

## ⛔ Legal (US launch)
4. **Platform legal status:** intermediary/agent vs. seller-of-record — draft US
   ToS to match the intended (intermediary) posture; confirm it holds for
   liability and tax.
5. **US consumer protection:** returns/refund posture for bespoke goods across
   relevant states; draft refund/remake policy accordingly.
6. **Data protection:** US state privacy (CCPA/CPRA) for customer PII
   (measurements, addresses, videos) — retention + deletion path. Build it so
   GDPR/UK-GDPR is a config away later.

## ⛔ Payments
7. **Payout staging:** exact schedule — how much on acceptance vs.
   delivery/fit-confirmation, and the auto-release window if the customer goes
   silent.
8. **Fee base:** confirm the platform fee is charged on the item (not shipping
   or tax). Recommended: item only.
9. **Chargeback strategy:** evidence requirements, ToS terms, and how the held
   payout absorbs losses.

## Product scope
10. **Garment types at launch:** start with one or two (suits + shirts?) to keep
    the measurement schema and option model small — align with what the test
    tailor makes.
11. **Fit guarantee generosity:** remake vs. refund vs. local alteration — and
    who funds each. Generous early is likely cheaper than churn.
12. **Fabric sourcing truth:** are fabrics tailor-stocked (real availability) or
    "can source" (lead-time risk)? Model availability honestly.

## Shipping
13. **Shipping-speed catalog:** free-form per tailor, or a platform-standard set
    of carriers/tiers the tailor maps into? (Standardizing helps the customer
    compare.)
14. **Tracking:** manual tracking-number entry at launch; when to add carrier
    webhook/tracking-API automation (Phase 2)?
15. **Shipping-fee accuracy:** flat per-option price vs. live carrier rates —
    who eats the difference if the tailor under/over-quotes?

## Measurement
16. **v1 measurement UX:** guided manual, "measure an existing garment," or
    both? Reconcile with the test tailor's video method — which do we teach?
17. **AR:** build vs. integrate a 3rd-party body-measurement SDK — evaluate in
    Phase 3, don't commit now.

## Media / AI tiles
18. **Photo→tile pipeline:** which vision model; accuracy bar for extracted
    attributes; and the human-confirm step before a tile goes live.
19. **Media storage:** Supabase Storage vs. a dedicated image CDN (Cloudinary/
    imgix) for transforms + mobile optimization.

## Auth / roles
20. **Multi-role accounts:** confirm a single login can hold multiple roles
    (customer + tailor) and how the UI switches context.
21. **Admin surface scope:** what the admin console must do at launch
    (verify tailors, resolve disputes, moderate media, release payouts).

## Local finishers
22. **Funding model:** platform-funded (from held payout), customer-paid, or
    split? Test concierge before building.

## Business / go-to-market
18. **Supply acquisition:** how do you find and vet the first 5–15 tailors?
    (This is the true cold-start bottleneck.)
19. **Demand acquisition:** SEO on shop pages, content, referrals, paid? What's
    the first channel?
20. **Brand/trust positioning:** how do you make "buy a bespoke suit from a
    tailor 8,000 miles away, sight unseen" feel safe? (This is the marketing
    problem that mirrors the product problem.)
