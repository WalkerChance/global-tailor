# Global Tailor — Open Questions & Decisions

Resolve the **blocking** ones (⛔) before launch/revenue. The rest can be
decided as you build. Owners/answers to be filled in.

**Decided (rounds 2–3):** Stripe for payments + tax · US customers only at
launch (scale-ready schema) · mobile-first / iPhone-first web · role-based auth
(customer/tailor/admin, scaffold now) · a committed unpaid test tailor is the
seed dataset · tailor-owned **flat-rate** shipping (by item count/type) +
tailor-entered tracking · launch garment types = **suits, shirts, pants**
(selectable per shop; custom garments/options later) · **standardized**
measurements at launch (tailor-custom asks + AR later) · **type→material
pricing tie-through** designed now, simplest version in MVP.

**Build sequence (decided):** app + auth + the configure-and-order loop first
(validate with a **test order, no money**), then payments + tax in Phase 2.

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
10. **Standard option/cut sets:** define the standard cut/option groups for
    suits, shirts, and pants at launch — aligned with what the test tailor
    makes. (Garment types themselves are decided: suits/shirts/pants.)
11. **Fit guarantee generosity:** remake vs. refund vs. local alteration — and
    who funds each. Generous early is likely cheaper than churn.
12. **Fabric sourcing truth:** are fabrics tailor-stocked (real availability) or
    "can source" (lead-time risk)? Model availability honestly.

## Pricing tie-through
13. **MVP pricing formula:** confirm the launch formula (per-type base +
    per-fabric price + option modifiers) before layering in fabric-consumption
    math (`garment_fabric_pricing`). How do we keep the tailor's price entry
    simple while the model stays extensible?

## Shipping (flat-rate decided)
14. **Flat-rate structure:** exact shape of the tailor's flat rates — base + per
    additional item, and/or per item type. Simplest that covers "a suit + 2
    shirts in one DHL box for ~$70."
15. **Tracking automation:** manual tracking-number entry at launch; when to add
    carrier webhook/tracking-API automation (Phase 3)?
16. **Under/over-quote:** if the tailor's flat rate misses actual cost, who eats
    it? (Default: the tailor owns it, since they quote it.)

## Measurement
17. **Standard measurement set:** finalize the standard fields per garment type,
    reconciled with the test tailor's video method — what do we teach customers?
    (Tailor-custom asks come later via `measurement_fields`.)
18. **AR:** build vs. integrate a 3rd-party body-measurement SDK — evaluate
    later, don't commit now. Confirm it targets the same `measurement_fields`.

## Media / AI tiles
19. **Photo→tile POC first:** run a small proof-of-concept on the test tailor's
    photos (he shared a subset, via photos → categorization needed), then work
    with him to settle the right mix/accuracy bar and the human-confirm step
    before a tile goes live. Which vision model?
20. **Media storage:** Supabase Storage vs. a dedicated image CDN (Cloudinary/
    imgix) for transforms + mobile optimization.

## Auth / roles
21. **Multi-role accounts:** confirm a single login can hold multiple roles
    (customer + tailor) and how the UI switches context.
22. **Admin surface scope:** what the admin console must do at launch
    (verify tailors, moderate media/tiles; disputes + payout release arrive
    with Phase 2 payments).

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
