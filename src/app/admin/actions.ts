"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext, hasRole } from "@/lib/auth";
import type { UserRole } from "@/lib/types/database";

export type AdminState = { ok?: boolean; error?: string; message?: string };

const GRANTABLE: UserRole[] = ["tailor", "admin", "finisher"];

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const ctx = await getSessionContext();
  if (!ctx) return { error: "Sign in required." };
  if (!hasRole(ctx, "admin")) return { error: "Admin only." };
  return { userId: ctx.userId };
}

export async function grantRole(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!email) return { error: "Enter an email." };
  if (!GRANTABLE.includes(role)) return { error: "Pick a role to grant." };

  const supabase = await createClient();
  // Admin RLS lets us read all users; match by email (case-insensitive).
  const { data: user } = await supabase
    .from("users")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();
  // Guard against ilike wildcards (%/_) in the input matching a different user:
  // require an exact case-insensitive match.
  if (!user || (user.email ?? "").toLowerCase() !== email) {
    return { error: "No user with that email — they must sign up first." };
  }

  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: user.id, role, granted_by: auth.userId });

  if (error) {
    if (error.code === "23505") return { message: `${email} already has ${role}.` };
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { ok: true, message: `Granted ${role} to ${email}.` };
}

export async function revokeRole(formData: FormData): Promise<void> {
  const auth = await requireAdmin();
  if ("error" in auth) return;

  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!userId || !role) return;
  // Don't let an admin revoke their own admin role (avoid lockout).
  if (userId === auth.userId && role === "admin") return;

  const supabase = await createClient();
  await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  revalidatePath("/admin");
}

export async function setVerification(formData: FormData): Promise<void> {
  const auth = await requireAdmin();
  if ("error" in auth) return;

  const tailorId = String(formData.get("tailor_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["unverified", "pending", "verified", "rejected"];
  if (!tailorId || !allowed.includes(status)) return;

  const supabase = await createClient();
  await supabase
    .from("tailor_profiles")
    .update({ verification_status: status })
    .eq("user_id", tailorId);
  revalidatePath("/admin");
}
