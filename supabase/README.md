# Supabase setup

The database schema lives in [`migrations/`](migrations). It is plain SQL and
can be applied with the Supabase CLI or pasted into the SQL editor.

## Apply the schema

**Option A — Supabase CLI (recommended)**
```bash
supabase link --project-ref <your-project-ref>
supabase db push        # applies everything in migrations/ in order
```

**Option B — SQL editor**
Run `0001_init.sql` then `0002_seed_standard.sql` in the dashboard SQL editor.

## Auth configuration (dashboard)

1. **Authentication → Providers → Email**: enable email/password. For local
   testing you may turn *off* "Confirm email" so signups get a session
   immediately; keep it *on* for anything real.
2. **Authentication → URL configuration**: add your site URL and
   `.../auth/callback` as a redirect URL.

## How roles work

- Every new signup is mirrored into `public.users`, granted the `customer` role
  in `user_roles`, and given a `customers` profile row — all via the
  `on_auth_user_created` trigger in `0001_init.sql`.
- **RLS** is enforced through `public.has_role()` / `public.is_admin()`
  (security-definer helpers) so a tailor sees only their shop and a customer
  only their own orders/measurements.
- Grant a **tailor** or **admin** role by inserting into `user_roles` (an admin
  can do this through the app later; for now, via SQL):
  ```sql
  insert into public.user_roles (user_id, role)
  values ('<auth-user-uuid>', 'tailor');
  ```

## Optional: roles in the JWT

RLS reads roles from the table, so nothing is required. If you later want roles
as a JWT claim (to avoid a lookup in app code), add a
`custom_access_token_hook` function and enable it under
**Authentication → Hooks**. Not needed for Phase 1.

## Storage

`0003_storage.sql` creates a public `media` bucket with owner-scoped write
policies (objects are namespaced by uploader uid). Fabric photos upload here and
their public URL is stored in the `media` table — never blobs in Postgres.

## Demo data (optional)

To try the full build-and-order loop quickly, run
[`seed_demo.sql`](seed_demo.sql): sign up a user, put their `auth.users.id` into
the script, and run it. It grants the tailor role and creates a fully-configured
"Demo Tailors" shop (garment types, fabrics, a Lapel option group, shipping).
