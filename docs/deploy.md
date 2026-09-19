# Deploying Global Tailor to Vercel

The app is a standard Next.js (App Router) project. Vercel detects and builds it
with no custom config — there is intentionally **no `vercel.json`**.

## 1. Import the repo
- Vercel → **Add New… → Project** → import `WalkerChance/global-tailor`.
- Framework preset: **Next.js** (auto-detected). Build command `next build`,
  output handled automatically. Node 20 (see `.nvmrc` / `engines`).

## 2. Environment variables
Add these under **Project → Settings → Environment Variables** for both
**Production** and **Preview**:

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon/publishable key; RLS enforces access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Optional; only for trusted server tasks. Never expose. |

> The build itself does not need real values (pages read env at request time),
> but the running app does — set them before the first real request.

## 3. Supabase auth URLs
In Supabase → **Authentication → URL configuration**:
- **Site URL**: your primary Vercel domain (e.g. `https://global-tailor.vercel.app`).
- **Redirect URLs**: add `https://<domain>/auth/callback`. For preview
  deploys, add the preview pattern or the specific preview URL you test with.

## 4. Preview deployments
Each PR gets a preview URL. Because previews use per-deployment domains, either
add the preview domain to Supabase redirect URLs or test auth on a stable
domain. The app works read-only (browsing shops) without auth configured.

## 5. Database
Vercel does not run migrations. Apply `supabase/migrations/` to your Supabase
project via the Supabase CLI or SQL editor (see `supabase/README.md`) before or
alongside the first deploy.

## Notes
- Middleware (`middleware.ts`) runs on Vercel's Edge and refreshes the Supabase
  session per request; it needs the two `NEXT_PUBLIC_*` vars at runtime.
- No payments/Stripe env is needed in Phase 1.
