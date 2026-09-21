-- Global Tailor — function hardening (from Supabase security advisor)
--
-- 1) Pin set_updated_at()'s search_path (advisor 0011).
-- 2) handle_new_user() is only ever run by the auth.users trigger, so remove it
--    from the REST RPC surface (advisor 0028/0029).
--
-- Note: has_role() and is_admin() intentionally remain executable by anon /
-- authenticated — RLS policies call them as the querying role, and they only
-- ever reveal the caller's own roles (auth.uid()), so this is by design.

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
