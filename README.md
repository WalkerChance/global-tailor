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

## Locked direction (v2 of the plan)

- **Mobile-first / iPhone-first** responsive web (PWA-ready), not native apps.
- **US customers only at launch**; schema and flows built to scale beyond the US.
- **Stripe** for payments and tax; a **separate research workstream** resolves
  US marketplace sales-tax obligations and the take-rate break-even.
- **Role-based auth** (customer / tailor / admin; finisher later), scaffolded
  from day one, enabled progressively.
- **Customer-selected shipping speed** from tailor-enabled options; tailor
  enters the tracking number after drop-off.
- Seeded by a **committed unpaid test tailor** (measurement videos, cuts,
  material photos), with an **AI photo→"tile"** pipeline turning raw material
  photos into clean selection swatches.

## Status

- [x] Plan drafted and refined (round 2)
- [ ] US tax + break-even research (separate workstream)
- [ ] Key legal decisions resolved (see open questions)
- [ ] MVP scope locked
- [ ] Tech foundation scaffolded (auth/roles/RLS first)
