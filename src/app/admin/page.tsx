import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GrantRoleForm } from "@/components/admin/grant-role-form";
import { revokeRole, setVerification } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Admin" };

const VERIFY_STATES = ["unverified", "pending", "verified", "rejected"];

export default async function AdminPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login?next=/admin");
  if (!hasRole(ctx, "admin")) {
    return (
      <div className="py-16">
        <h1 className="font-serif text-2xl font-medium">Not authorized</h1>
        <p className="mt-2 text-ink-soft">This area requires the admin role.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ count: tailors }, { count: pending }, { count: orders }, { data: shops }, { data: grants }] =
    await Promise.all([
      supabase.from("tailor_profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("tailor_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending"),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("tailor_profiles")
        .select("user_id, shop_name, slug, verification_status, users(email)")
        .order("shop_name"),
      supabase
        .from("user_roles")
        .select("user_id, role, users(email)")
        .in("role", ["tailor", "admin", "finisher"]),
    ]);

  return (
    <div className="py-10">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Admin</p>
      <h1 className="mt-2 font-serif text-3xl font-medium">Operations</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Tailors" value={tailors ?? 0} />
        <Stat label="Pending verification" value={pending ?? 0} />
        <Stat label="Orders" value={orders ?? 0} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GrantRoleForm />

        <section>
          <h2 className="font-serif text-lg font-semibold">Role grants</h2>
          {!grants || grants.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No non-customer roles granted yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {grants.map((g, i) => {
                const u = g.users as unknown as { email: string | null } | null;
                return (
                  <li
                    key={`${g.user_id}-${g.role}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {u?.email ?? g.user_id.slice(0, 8)}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs text-brass">{g.role}</span>
                      {!(g.user_id === ctx.userId && g.role === "admin") && (
                        <form action={revokeRole}>
                          <input type="hidden" name="user_id" value={g.user_id} />
                          <input type="hidden" name="role" value={g.role} />
                          <button className="font-mono text-xs text-ink-soft hover:text-brass">
                            revoke
                          </button>
                        </form>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold">Tailors</h2>
        {!shops || shops.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No shops yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {shops.map((s) => {
              const u = s.users as unknown as { email: string | null } | null;
              return (
                <li
                  key={s.user_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.shop_name}</span>
                    <span className="block font-mono text-xs text-ink-soft">
                      {u?.email ?? "—"} · {s.verification_status}
                    </span>
                  </span>
                  <form action={setVerification} className="flex items-center gap-2">
                    <input type="hidden" name="tailor_id" value={s.user_id} />
                    <select
                      name="status"
                      defaultValue={s.verification_status}
                      className="input w-36"
                      aria-label={`Verification status for ${s.shop_name}`}
                    >
                      {VERIFY_STATES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <button className="btn-primary">Save</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 font-mono text-xs text-ink-soft">
        Disputes and payout release arrive with Phase 2.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <section className="card">
      <div className="font-serif text-3xl font-medium tabular-nums">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </div>
    </section>
  );
}
