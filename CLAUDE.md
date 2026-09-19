# CLAUDE.md — Global Tailor

Context for agents working in this repo.

## What this is
A mobile-first / iPhone-first marketplace: tailors worldwide run a shop; US
customers build a bespoke garment, submit measurements, pick shipping, and order.
Full plan in [`docs/`](docs) — start with `docs/product-plan.md`,
`docs/architecture.md`, `docs/roadmap.md`, and the visual `docs/plan.html`.

## Build sequence (important)
App + auth + the configure-and-order loop come **first**, validated with a
**test order (no money, no tailor engagement)**. Payments + tax (Stripe) are
**Phase 2** — do not add them to Phase 1.

## Stack
- **Next.js (App Router) + React + TypeScript**, mobile-first, Tailwind CSS.
- **Supabase**: Postgres + Auth + Storage + **RLS**. Schema in
  `supabase/migrations/`.
- Path alias: `@/*` → `src/*`.

## Conventions
- **Money**: integer minor units (cents) + a `currency` code. Never floats.
  Format with `formatMoney()` in `src/lib/types/database.ts`.
- **US-only at launch**, schema scale-ready — don't hardcode "US/USD only".
- **Roles are data** (`user_roles`), not hardcoded branches: `customer`,
  `tailor`, `admin` (`finisher` later). A user may hold multiple roles.
- **RLS is the security boundary.** Enforce access in the DB (policies in
  `0001_init.sql`), not just in app code. New tables must enable RLS + policies.
- **Extensible-by-design, minimal-at-launch**: garment types, measurement
  fields, and fabric pricing are data so custom garments/measurements + AR are
  new rows, not migrations.
- **Media**: store URLs/links in the `media` table, never blobs.

## Auth wiring
- Server: `createClient()` in `src/lib/supabase/server.ts` (async cookies).
- Browser: `createClient()` in `src/lib/supabase/client.ts`.
- `middleware.ts` refreshes the session and redirects unauthenticated users away
  from `/account`, `/shop`, `/admin`. Role checks live in those server pages via
  `getSessionContext()` / `hasRole()` in `src/lib/auth.ts`.

## Run
```bash
npm install
cp .env.example .env.local   # fill Supabase URL + anon key
npm run dev
```
`npm run typecheck` and `npm run build` should pass before committing.

## Not in Phase 1
Payments/tax (Stripe), AR, local finishers, custom garments/measurements,
non-US markets, native apps.
