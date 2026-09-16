# Global Tailor — Product Plan

## 1. Vision

Give skilled tailors anywhere in the world a storefront and a fair channel to
customers in high-income markets (US, UK, EU), and give those customers
affordable, genuinely bespoke/made-to-measure clothing with the confidence of a
platform standing behind the transaction.

The platform's job is **discovery, trust, and money movement**. The garment
itself is a contract between customer and tailor.

### Why now / why this can work
- Skilled tailoring labor is dramatically cheaper outside the target markets;
  the price/quality arbitrage is real and durable.
- Made-to-measure is a natural e-commerce fit *once* you solve measurement and
  trust — those are the two hard problems, and they're solvable incrementally.
- Existing options are fragmented: individual tailors on WhatsApp/Instagram
  with no escrow, no dispute process, and no standardized "build" experience.

### Why it's hard (name it up front)
1. **Trust across a distance for a non-returnable custom good.** If it doesn't
   fit, both sides lose. This is the central product problem.
2. **Measurement accuracy** without a professional present.
3. **Cross-border payments, tax, and consumer-protection law** — the founder's
   "I don't want to handle import/export tax yet" instinct is right for
   *garment* logistics, but the *platform* still has facilitator-level tax and
   compliance exposure that can't be waved away (see §7 and open questions).
4. **Long fulfillment times** (weeks) create payment/chargeback risk that a
   normal e-commerce flow doesn't have.

None of these are blockers. They shape the sequencing.

## 2. Personas

**Aisha — the tailor (supply).** Runs a shop in e.g. Lagos, Bangkok, Istanbul,
or Ho Chi Minh City. Skilled, wants Western customers, has a phone and photos,
limited English maybe, no e-commerce ops. Needs: easy shop setup, clear
pricing, guaranteed payment, and to not get scammed on chargebacks.

**Daniel — the customer (demand).** US/UK/EU professional who wants a bespoke
suit/shirt at a fraction of a local tailor's price and is willing to wait.
Needs: to trust it'll fit, understand total landed cost (incl. shipping), and
have recourse if it goes wrong.

**Marco — the local finisher (post-delivery supply).** A tailor in the
customer's own city who does minor alterations. Needs: a trickle of paid,
low-friction alteration jobs.

## 3. The two sides of the marketplace

### 3.1 Tailor experience (the shop)
- **Onboarding & verification:** identity/business verification, sample-work
  review, payout (KYC) onboarding via the payments provider. This gate is a
  trust feature, not a nuisance — keep it but make it fast.
- **Shop profile:** name, story, location, specialties, turnaround time,
  languages, ratings.
- **Sample catalog:** photos of finished garments (suits, shirts, trousers,
  formalwear) with descriptions. These are *inspiration + capability proof*,
  not fixed SKUs.
- **Materials/fabric library:** photos of fabrics the tailor stocks or can
  source — wool, linen, cotton, blends, linings — each with attributes
  (composition, weight/GSM, color, pattern, price tier, availability).
- **Cut/option definitions:** the tailor declares what they can make and the
  choices they offer (e.g. suit → 1/2/3-button, lapel type, vents, lining
  color, monogram). This is what powers the customer's configurator.
- **Pricing model:** base price per garment type + fabric price tier +
  option modifiers. Keep it structured so totals are computable, not chat-only.
- **Order management:** incoming orders, measurement sheets, status updates
  (accepted → in production → shipped → delivered), messaging with customer.

### 3.2 Customer experience (browse → build → order)
- **Discovery:**
  - Shop by **shop** (browse tailors, their story and portfolio)
  - Shop by **cut/garment type** (all tailors who make double-breasted suits)
  - Shop by **material** (linen summer suiting across tailors)
  - Filters: price range, turnaround, ratings, region, language.
- **The garment configurator ("build your item") — the core feature.**
  From within a shop or a specific sample, the customer:
  1. Picks a garment type (suit, shirt, trousers…).
  2. Selects fabric(s) from that tailor's library (main + lining, etc.).
  3. Selects cut and options (defined by the tailor).
  4. Sees a **live running total** and estimated turnaround.
  5. Enters/attaches **measurements** (see §5).
  6. Places the order → payment.
- **Order tracking & messaging** with the tailor.
- **Post-delivery:** confirm fit, leave a review, or request an alteration via
  the local-finisher network (§6).

## 4. Marketplace mechanics & business model

- **Revenue:** platform fee = a small % of each sale (a "facilitation fee"),
  deducted at payout. Model both a **buyer-side** and **seller-side** split
  later; start with a single seller-side take rate for simplicity
  (illustratively 8–15% — validate against payment-processing costs, which are
  material on cross-border card payments).
- **The contract is customer↔tailor.** The platform is an intermediary/agent,
  not the seller of record. This is a deliberate legal posture (limits product
  liability and import-of-record duties) but it must be reflected accurately in
  Terms of Service and *cannot* fully offload marketplace-facilitator tax
  obligations — see §7.
- **Shipping is the tailor's responsibility**, priced into or added onto the
  order, shipped DDU/"recipient pays duties" by default so the *customer* is
  the importer of record. The customer must see this clearly at checkout (total
  price + "you may owe local duties/VAT on delivery"). Surprise customs bills
  are a top churn/dispute driver — surface it early and honestly.
- **Fee transparency:** show the customer one clear price; show the tailor
  exactly what they net.

## 5. Measurements (the make-or-break detail)

Phased, because AR is a later luxury, not a v1 requirement:

- **Phase 1 — guided manual entry.** A structured, illustrated measurement
  wizard per garment type (chest, waist, sleeve, inseam, etc.) with photo/video
  instructions and a "have a friend help / visit any local tailor to measure"
  prompt. Store measurements as a reusable **measurement profile** on the
  customer account.
- **Phase 1.5 — measurement assist.** Let customers upload a reference (an
  existing well-fitting garment's measurements) — often more reliable than
  body measurements for MTM.
- **Phase 2 — fit confirmation loop.** Tailor reviews submitted measurements
  and can flag/query before cutting. Reduces the worst failure mode.
- **Phase 3 — AR/photo measurement.** Integrate or build a computer-vision
  body-measurement tool. Evaluate 3rd-party SDKs before building. This is a
  differentiator, not a dependency.
- **Fit guarantee / remake policy.** A defined remake-or-alteration policy
  (partly funded by a held portion of payout, partly by the local-finisher
  network) is what makes buying a $300 suit sight-unseen feel safe. Design this
  from day one even if generous — it's cheaper than churn.

## 6. Local finisher network (post-delivery alterations)

- Directory of vetted local alteration tailors in customer cities.
- Triggered when a delivered garment needs minor tweaks.
- Options to explore: platform-funded (small allowance drawn from the held
  payout / fit-guarantee pool) vs. customer-paid vs. split.
- Start **manual/concierge** (a curated list + a support human arranging it)
  before building a full second marketplace. Don't build two marketplaces at
  once.

## 7. Trust, safety, legal & tax (do not skip)

This is where well-intentioned marketplaces get hurt. Treat these as first-class.

- **Payments hold / escrow-like flow.** Because fulfillment takes weeks and
  goods are non-returnable, capture funds up front but **delay/stage payout**
  to the tailor (e.g. partial on acceptance, remainder on delivery/fit
  confirmation). Protects both sides and limits chargeback loss.
- **Dispute resolution.** A defined process: evidence (photos, measurement
  records, messages), decision, and a funded remedy (remake / partial refund /
  local alteration). The staged payout is what funds this.
- **Chargeback exposure.** High-ticket, long-delivery custom goods are
  chargeback magnets. Mitigate with clear ToS, delivery proof, signed order
  specs, and staged payouts.
- **KYC/AML on tailors.** Handled largely by the payments provider (Stripe
  Connect Custom/Express onboarding), but the platform owns the policy.
- **Marketplace-facilitator tax reality (get advice — this is the big one).**
  - *US:* many states have "marketplace facilitator" laws that can require the
    *platform* to collect/remit **sales tax** even though the tailor is the
    seller and ships from abroad. "The tailor is the importer" does not, by
    itself, remove this.
  - *UK/EU:* **VAT/IOSS** rules for imported goods and for online marketplaces
    can make the *platform* the deemed supplier/collector in some low-value
    import scenarios. Again, independent of who physically ships.
  - **Action:** the "I don't want to touch import/export tax yet" goal is
    achievable for *duties on the physical garment* (customer as importer of
    record, DDU shipping) — but *platform-level* sales-tax/VAT collection is a
    separate question that needs a tax advisor before launch, per target
    market. Don't architect the payment flow in a way that's impossible to add
    tax collection to later. See `docs/open-questions.md`.
- **Consumer protection / distance-selling.** UK/EU distance-selling and
  consumer-rights rules have carve-outs for *bespoke/personalized* goods (often
  not returnable) — useful, but must be disclosed correctly. US state consumer
  law varies. ToS and refund policy need legal review.
- **Prohibited/quality risk.** Counterfeit-brand requests, IP (logos), and
  quality fraud. Content moderation + a takedown path.

## 8. Success metrics

- **Liquidity:** time-to-first-order for a new tailor; % of shops with ≥1 sale.
- **Trust:** order completion rate, dispute rate, remake rate, refund rate.
- **Fit:** % orders needing alteration; alteration cost per order.
- **Economics:** take rate realized vs. payment-processing cost; contribution
  margin per order; repeat-purchase rate (the real prize — a happy customer
  reorders for years).
- **Funnel:** browse → configure → measurement completion → paid order.
  (Measurement completion is likely the biggest drop-off — watch it.)

## 9. Guiding principles for the build

1. **Sequence around trust, not features.** The configurator is fun; the
   payment-hold + fit-guarantee + dispute loop is what makes people buy.
2. **Manual before automated.** Concierge onboarding, manual verification, and
   a human-in-the-loop for early disputes teach you the rules before you code
   them. AR and the local-finisher marketplace come later.
3. **Get the legal/tax posture reviewed before launch, not after revenue.**
4. **Structured data over chat.** Fabrics, options, and pricing must be
   modeled, not buried in free-text messages, or nothing downstream works
   (totals, search, disputes).
