# Security model

How access control works today, and what to harden before payments (Phase 2).

## Authentication
- Supabase Auth (email/password). Sessions are cookie-based via `@supabase/ssr`;
  `middleware.ts` refreshes the session each request and redirects
  unauthenticated users away from `/account`, `/shop`, `/admin`.

## Authorization
- **Roles are data** in `user_roles` (`customer`/`tailor`/`admin`/`finisher`);
  a user may hold several. `getSessionContext()`/`hasRole()` read them.
- **RLS is the boundary.** Every table has RLS enabled with policies in
  `supabase/migrations/0001_init.sql`. `has_role()` / `is_admin()` are
  `security definer` helpers so policies can check roles without recursion.
- **Server actions re-check authorization** (tailor/admin/party) and never
  trust client-supplied prices — `createOrder` recomputes every amount
  server-side and validates that the fabric, options, and shipping option
  belong to the shop and garment type.

## Input & output hardening
- **Open redirects**: post-auth `next`/`return_to` targets pass `safeNextPath()`
  (local paths only) in the auth form, callback route, and `createOrder`.
- **User-supplied links**: shipment `tracking_url` is rendered only when
  `isHttpUrl()` passes (blocks `javascript:` etc.).
- **Search filters**: the material search sanitizes the term before building a
  PostgREST `.or()` filter (strips `,()%*`).
- **Admin email lookup**: `grantRole` requires an exact case-insensitive email
  match, so `ilike` wildcards can't target an unintended user.
- React escapes rendered text (messages, bios, names) by default.

## Storage
- `media` is a public bucket (marketplace images are meant to be public).
  Writes are owner-scoped: an object's first path segment must equal the
  uploader's uid (`0003_storage.sql`). Only fabric photos are uploaded today.

## Secrets
- Only `NEXT_PUBLIC_*` keys reach the browser; `SUPABASE_SERVICE_ROLE_KEY` is
  server-only and unused in Phase 1. `.env*` is git-ignored.

## Known hardening for Phase 2 (before money moves)
- **Column-level order mutations.** `orders_party_update` lets either party
  update the order row; RLS is row-level, not column-level, so a crafted API
  call could alter `total`/`status`. This is acceptable in Phase 1 because every
  order is `is_test` and no funds move. Before payments, move state transitions
  and any amount changes into `security definer` RPCs (or revoke UPDATE on
  sensitive columns) so customers/tailors cannot change prices or force
  `fit_confirmed`.
- **Media**: validate/transcode uploads (content-type, dimensions) and add
  moderation before public exposure at scale; the AI tile step will own this.
- **Abuse**: add rate limiting to messaging and order creation.
- **PII**: measurement/address data — add retention + deletion (CCPA/CPRA) as
  the customer base grows.
