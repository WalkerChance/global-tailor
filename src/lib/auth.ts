import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export type SessionContext = {
  userId: string;
  email: string | null;
  roles: UserRole[];
};

/**
 * Returns the signed-in user and their roles, or null if unauthenticated.
 * Roles are read from user_roles (RLS lets a user read their own roles).
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return {
    userId: user.id,
    email: user.email ?? null,
    roles: (roleRows ?? []).map((r) => r.role as UserRole),
  };
}

export function hasRole(ctx: SessionContext | null, role: UserRole): boolean {
  return !!ctx && ctx.roles.includes(role);
}

/** Require a signed-in user, redirecting to login (preserving `next`) if not. */
export async function requireUser(next: string): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(next)}`);
  return ctx;
}

/**
 * Require the tailor role. Redirects to login if signed out, or to /shop
 * (which shows the "become a tailor" state) if signed in without the role.
 */
export async function requireTailor(next: string): Promise<SessionContext> {
  const ctx = await requireUser(next);
  if (!hasRole(ctx, "tailor")) redirect("/shop");
  return ctx;
}
