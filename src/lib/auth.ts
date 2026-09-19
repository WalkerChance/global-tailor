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
