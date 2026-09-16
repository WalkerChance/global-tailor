# Global Tailor — Open Questions & Decisions

Resolve the **blocking** ones (⛔) before launch/revenue. The rest can be
decided as you build. Owners/answers to be filled in.

## ⛔ Legal, tax & compliance (get professional advice — don't guess)
1. **Marketplace-facilitator sales tax (US):** In target US states, is the
   *platform* obligated to collect/remit sales tax on these sales even though
   the tailor is the seller and ships from abroad? (Likely yes in several
   states, independent of who the importer is.) → tax advisor.
2. **VAT / IOSS (UK & EU):** For imported goods sold via an online marketplace,
   is the platform the "deemed supplier" required to collect VAT at checkout
   (esp. low-value consignments)? → tax advisor per market.
3. **Import duties on the garment:** Confirm the intended posture — customer as
   **importer of record**, DDU shipping, duties billed by carrier on delivery —
   is workable and clearly disclosed. (This is the part the founder wants to
   avoid owning; it's the *achievable* part.)
4. **Consumer protection / distance selling:** Confirm the
   bespoke/personalized-goods carve-outs (returns) for UK/EU and the required
   disclosures; draft refund/remake policy accordingly.
5. **Platform legal status:** intermediary/agent vs. seller-of-record — get the
   ToS drafted to match the intended (intermediary) posture, and confirm it
   holds up for liability and tax.
6. **Data protection:** GDPR/UK-GDPR compliance for EU/UK customer PII
   (measurements, addresses) — processing basis, retention, deletion.

## ⛔ Payments
7. **Take rate:** what % keeps the platform ahead of Stripe + cross-border +
   FX + support costs while staying attractive to tailors? Model it.
8. **Payout staging:** exact schedule — how much on acceptance vs.
   delivery/fit-confirmation, and the auto-release window if the customer goes
   silent.
9. **Currency policy:** do tailors price in local currency or a settlement
   currency? Who bears FX? What does the customer see?
10. **Chargeback strategy:** evidence requirements, ToS terms, and how the held
    payout absorbs losses.

## Product scope
11. **First corridor:** which tailor region → which customer country first?
    (Narrow = tractable shipping/tax/support.)
12. **Garment types at launch:** start with one or two (suits + shirts?) to keep
    the measurement schema and option model small.
13. **Fit guarantee generosity:** remake vs. refund vs. local alteration — and
    who funds each. Generous early is likely cheaper than churn.
14. **Fabric sourcing truth:** are fabrics tailor-stocked (real availability) or
    "can source" (lead-time risk)? Model availability honestly.

## Measurement
15. **v1 measurement UX:** pure guided manual, or manual + "measure an existing
    garment"? (The latter is often more reliable — consider shipping both.)
16. **AR:** build vs. integrate a 3rd-party body-measurement SDK — evaluate in
    Phase 3, don't commit now.

## Local finishers
17. **Funding model:** platform-funded (from held payout), customer-paid, or
    split? Test concierge before building.

## Business / go-to-market
18. **Supply acquisition:** how do you find and vet the first 5–15 tailors?
    (This is the true cold-start bottleneck.)
19. **Demand acquisition:** SEO on shop pages, content, referrals, paid? What's
    the first channel?
20. **Brand/trust positioning:** how do you make "buy a bespoke suit from a
    tailor 8,000 miles away, sight unseen" feel safe? (This is the marketing
    problem that mirrors the product problem.)
