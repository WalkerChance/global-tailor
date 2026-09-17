# Global Tailor

A two-sided, **mobile-first** marketplace connecting bespoke and
made-to-measure tailors around the world with customers **in the US at launch**
(built to scale to the UK/Europe next). Tailors run a virtual shop (clothing
samples, materials, pricing, shipping options). Customers browse by shop, cut,
or material on their phone, **build their garment** (fabric + lining + cut +
options), submit measurements, **pick a shipping speed**, and pay through the
platform. Global Tailor facilitates the payment (Stripe) and takes a small
percentage; the actual garment contract is between the customer and the tailor,
and the tailor handles international shipping and enters the tracking number.

## What's here

This repository currently contains the **plan**, not the application. Start
here:

| Document | What it covers |
|---|---|
| [`docs/product-plan.md`](docs/product-plan.md) | Vision, personas, marketplace mechanics, the garment configurator, payments model, trust & safety, and the hard cross-border/legal questions. |
| [`docs/architecture.md`](docs/architecture.md) | Recommended tech stack, data model, payment flow (Stripe Connect), media handling, and integrations. |
| [`docs/roadmap.md`](docs/roadmap.md) | Phased build plan from MVP to AR measurement, with what to defer and why. |
| [`docs/open-questions.md`](docs/open-questions.md) | Decisions that need answers (legal, tax, payments, pricing) before or during the build. |

## The one-paragraph model

Tailors onboard and publish shops. Customers configure a garment from a
tailor's fabrics and cut options, submit measurements, and place an order.
Payment is captured by the platform and held; the platform's fee is deducted
and the remainder is paid out to the tailor (with a portion held until the
customer confirms fit/receipt where possible). The tailor manufactures and
ships direct to the customer as the importer of record. A separate network of
**local finishing tailors** handles minor alterations after delivery.

## Locked direction

- **Build order: app + auth + the loop first, payments/tax second.** Prove the
  configure-and-order loop end to end with a **test order (no money)**, then
  wire Stripe. Auth is the first thing built.
- **Mobile-first / iPhone-first** responsive web (PWA-ready), not native apps.
- **US customers only at launch**; schema and flows built to scale beyond the US.
- **Role-based auth** (customer / tailor / admin; finisher later), scaffolded
  from day one, enabled progressively.
- **Launch garment types: suits, shirts, pants** — selectable per shop (pants
  work standalone or in a suit). Custom garments/options come later; the model
  is extensible from day one.
- **Standardized measurements** at launch; tailor-custom measurement asks and
  AR plug into the same extensible schema later.
- **Type → material pricing tie-through** designed now (a suit uses more fabric
  than a shirt), simplest version shipped in MVP.
- **Tailor-owned flat-rate shipping** (by item count/type — they quote it);
  tailor enters the tracking number after drop-off.
- **Stripe** for payments and tax (Phase 2); a **separate research workstream**
  resolves US marketplace sales-tax obligations and the take-rate break-even.
- Seeded by a **committed unpaid test tailor** (measurement videos, cuts,
  material photos), with an **AI photo→"tile"** pipeline (POC first) turning raw
  material photos into clean selection swatches.

## Status

- [x] Plan drafted and refined (round 3)
- [ ] Phase 1 scaffolded: app + auth/roles/RLS + shop + configurator (test order)
- [ ] US tax + break-even research (separate workstream, feeds Phase 2)
- [ ] Payments (Stripe Connect) + tax wired (Phase 2)
- [ ] Key legal decisions resolved (see open questions)
