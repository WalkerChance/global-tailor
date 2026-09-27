import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components (browser). RLS enforces access.
 * NOTE: generated DB types live in `@/lib/types/supabase` (Database). Adopting
 * them as `createBrowserClient<Database>` is a follow-up — our aliased embeds
 * (`tile:tile_media_id(...)`) need per-query `.returns<T>()` annotations first.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
