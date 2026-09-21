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
- **Garment types the shop offers:** a **selectable configuration** when
  setting up the shop. At launch the choices are **suits, shirts, and pants**
  (pants behave the same standalone or as part of a suit). A tailor enables the
  types they make; later phases let them add **custom items/garment designs**
  (§3.4).
- **Cut/option definitions:** for each enabled garment type, the tailor
  declares the choices they offer (e.g. suit → 1/2/3-button, lapel type, vents,
  lining color, monogram). This powers the customer's configurator. Full custom
  options come in a later phase.
- **Pricing model:** base price per garment type + **fabric/material price
  (tied through as the material is chosen)** + option modifiers. Keep it
  structured so totals are computable, not chat-only. See §4 for the
  type→material pricing tie-through.
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
  5. **Confirms or adjusts measurements** — pulled from their saved profile and
     guided by the tailor's method, not entered from a blank slate (see §5).
  6. **Chooses a shipping option** (flat-rate, tailor-set — see §4.1), which
     adds to the total and sets the delivery estimate.
  7. Places the order → (test order at launch; payment added in a later phase).
- **Order tracking & messaging** with the tailor.
- **Post-delivery:** confirm fit, leave a review, or request an alteration via
  the local-finisher network (§6).

### 3.3 Accounts & roles (scaffold now, enable progressively)
One account system, **role-based**: `customer`, `tailor`, `admin` (and
`finisher` later). A single person can hold more than one role (a customer who
is also a tailor). The experience differs by role — customers browse/build/buy,
tailors manage a shop and orders, admins verify tailors and resolve disputes.
Build the role-aware auth **into the foundation from day one** — it is the
**first thing built** and everything sits on it. The app + auth + core loop are
validated *before* real payments and tax are wired (see roadmap); it must be
transferable to a scalable platform, not bolted on later. Mechanics in
architecture §2.1.

### 3.4a Customer profile
Every customer has a **reusable profile** so nothing is re-entered order to order:
- **Name & contact** (name, email, phone).
- **Shipping address(es)** — one or more, with a default.
- **Saved measurements** — the measurement profile(s) (§5), reused and refined
  over time rather than re-taken each order.
- **Preferences** (style/fit/comms) — **post-MVP**; the field exists in the
  model now, the UI comes later.
- **Saved payment method(s)** — added later, **stored on/via Stripe**, never on
  our servers. We keep only a Stripe customer reference and non-sensitive
  metadata (brand, last-4, expiry); Stripe holds the actual card. Arrives with
  payments (Phase 2+), so a returning customer can check out in one tap.
The profile is the customer's home base; the order loop reads from it and writes
refinements back to it.

### 3.4 Garment types & customization (staged)
- **Launch:** three standardized garment types — **suits, shirts, pants** —
  that a tailor turns on per shop. Pants are a first-class type that works both
  standalone and as the trouser component of a suit (same definition either
  way).
- **Later phases:** tailors can add **custom items / garment designs** and
  **full custom option sets** beyond the standard three — so the platform grows
  from a fixed catalog into an open design surface without reworking the core.
- **Design now, ship later:** the garment-type / option / pricing model is
  built to be *extensible* from day one (types are data, not hardcoded), even
  though only the three standard types are enabled at launch.

## 4. Marketplace mechanics & business model

> **Launch scope: US customers only.** Everything below is modeled to scale to
> the UK/EU later, but v1 enables the US corridor only (tailors anywhere →
> customers in the US). This keeps shipping, tax, and support tractable.
> The app is **mobile-first / iPhone-first** — the whole configure-and-checkout
> flow must feel native on a phone.

- **Revenue:** platform fee = a small % of each sale (a "facilitation fee"),
  deducted at payout. Model buyer-side vs. seller-side split later; start with a
  single seller-side take rate. **The exact rate is set only after the tax/fee
  break-even research** (a dedicated workstream — see §7 and open questions),
  not guessed up front.
- **The contract is customer↔tailor.** The platform is an intermediary/agent,
  not the seller of record. This is a deliberate legal posture (limits product
  liability and import-of-record duties) but it must be reflected accurately in
  Terms of Service and *cannot* fully offload marketplace-facilitator tax
  obligations — see §7.

### 4.0 Pricing tie-through (garment type → material → options)
Price is computed by chaining choices, and it must update live as the customer
builds:
1. **Garment type** sets a base (a suit costs more than a shirt).
2. **Material** selection ties into the price — different fabrics carry
   different prices/tiers, and the price can also depend on *how much* fabric
   the chosen garment type needs (a suit uses more than a shirt). So the same
   fabric can contribute differently depending on the garment.
3. **Options/cuts** add modifiers (lining, monogram, extra trouser, etc.).
This type→material tie-through is a **scalable design requirement now** (the
model must support it) even if the MVP uses the simplest version — flat per-type
base + per-material price + option modifiers — before adding fabric-consumption
math. Keep it structured so totals are always computable, never chat-only.

### 4.1 Shipping (tailor-owned, flat-rate, tailor tracking)
- **The tailor owns shipping and quotes the cost.** They ship (DHL etc.) and
  they set the price — they know they can often ship a lot via DHL for ~$70.
- **Flat rate by item count / item type.** Keep it simple: the tailor sets flat
  shipping prices keyed to number of items and/or item type (e.g. "1 garment =
  $X, each additional = $Y"), rather than live carrier rates. The customer sees
  the resulting flat shipping cost at checkout; it's frozen onto the order.
  (Live carrier rates and who-eats-the-difference are explicitly *not* an MVP
  problem — see open questions.)
- **Tailor enters the tracking number** after drop-off (carrier + tracking #).
  This moves the order to *shipped*, gives the customer a live tracking link,
  and — combined with delivery/fit-confirmation — triggers the final staged
  payout release (§7).
- **Shipping is the tailor's responsibility**, shipped DDU/"recipient pays
  duties" by default so the *customer* is the importer of record. The customer
  must see this clearly at checkout (item + shipping + tax, plus "you may owe
  import duties on delivery"). Surprise customs bills are a top churn/dispute
  driver — surface it early and honestly.
- **Fee transparency:** show the customer one clear breakdown (item, shipping,
  tax); show the tailor exactly what they net. Platform fee is charged on the
  item, **not** the shipping the tailor quoted (see architecture §3).

## 5. Measurements (the make-or-break detail)

### 5.1 Our baseline: a real test tailor
We have a **committed test tailor** (unpaid, no fees charged) who has already
supplied a real-world baseline dataset:
- **Measurement videos** showing his preferred measurement method.
- **A set of cuts** he offers.
- **Photos of materials** he stocks.

This is the seed for the whole v1: it's the first shop, the first fabric
library, the first option/cut set, and the reference for the measurement UX.
The near-term job is to **turn these raw inputs into structured, reusable
platform data** — his material photos become normalized selection **tiles**
(architecture §4.3), his cuts become `option_groups`/`option_values`, and his
measurement videos inform the guided wizard. Expect to iterate on *how we
represent* what he gave us; the inputs themselves are settled.

### 5.2 Framing: measurement is a *confirm/adjust*, not blank-slate entry
The measurement step in the order loop is fundamentally a **confirmation or
adjustment**, not authoring from nothing:
- It's seeded by the customer's **saved measurement profile** (§3.4a) — a repeat
  customer confirms what's already there.
- It's **guided by the tailor's method** — the tailor defines the standard set
  and how to take it (informed by our test tailor's videos), so the customer is
  confirming against a known reference, not guessing.
- The **tailor can review and propose adjustments** before cutting
  (`order_measurement_reviews`); the customer accepts or declines. This
  tailor-in-the-loop confirmation is the single biggest reducer of the "it
  didn't fit" failure mode, so it's a near-term priority, not a far-future one.

### 5.3 Phasing
Phased, because AR is a later luxury, not a v1 requirement. Launch with
**standardized measurements** and make the model extensible so tailors can add
their own asks later — the same extensibility AR plugs into.

- **Launch — standardized guided confirm/adjust.** A structured, illustrated
  wizard with a **standard set per garment type** (chest, waist, sleeve, inseam,
  etc.), photo/video instructions, and a "have a friend help / visit any local
  tailor to measure" prompt. Prefilled from the saved profile; saved back as a
  reusable **measurement profile**. Same standard set for every tailor at launch
  — simpler for customers and comparable across shops.
- **Near-term — tailor confirm/adjust.** Tailor reviews submitted measurements
  and proposes adjustments before cutting; customer accepts/declines. The
  worst-failure-mode reducer above.
- **Later — measurement assist.** Let customers upload a reference (an existing
  well-fitting garment's measurements) — often more reliable than body
  measurements for MTM.
- **Later — tailor-custom measurements.** A tailor can add **their own custom
  measurement asks** (beyond the standard set) that make their output better.
  This uses the same extensible measurement model — build the schema for it now,
  enable it later.
- **Later — AR/photo measurement.** Integrate or build a computer-vision
  body-measurement tool that populates the (now extensible) measurement schema.
  Evaluate 3rd-party SDKs before building. A differentiator, not a dependency.
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
- **Marketplace-facilitator tax reality — US launch (dedicated research
  workstream).** Stripe is the right tool to *collect/remit* (Stripe Tax); the
  open question is *where and how much*.
  - *US (in scope now):* many states have "marketplace facilitator" laws that
    can require the *platform* to collect/remit **sales tax** even though the
    tailor is the seller and ships from abroad. "The tailor is the importer"
    does not, by itself, remove this.
  - *UK/EU (later):* **VAT/IOSS** rules can make the platform the deemed
    supplier/collector — noted for scale, out of scope for v1.
  - **Action:** run a **separate deep-dive (its own chat)** on US marketplace
    sales-tax obligations *and* compute the **break-even of take-rate vs. tax +
    processing cost**, so the fee is set on real numbers. The founder's "I don't
    want to touch import/export tax yet" goal is achievable for *duties on the
    physical garment* (customer as importer of record, DDU shipping); the
    *platform-level* sales-tax collection is the piece this research resolves.
    Architect Stripe/PaymentIntent so the tax line already exists. See
    `docs/open-questions.md`.
- **Consumer protection / distance-selling.** US state consumer law varies
  (in scope at launch); UK/EU distance-selling carve-outs for
  *bespoke/personalized* goods come later. ToS and refund policy need legal
  review before launch.
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
