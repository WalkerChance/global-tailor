import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext, hasRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };

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
  const [{ count: tailors }, { count: pending }, { count: orders }] =
    await Promise.all([
      supabase.from("tailor_profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("tailor_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending"),
      supabase.from("orders").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div className="py-10">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
        Admin
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium">Operations</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Tailors" value={tailors ?? 0} />
        <Stat label="Pending verification" value={pending ?? 0} />
        <Stat label="Orders" value={orders ?? 0} />
      </div>

      <p className="mt-8 font-mono text-xs text-ink-soft">
        Verify tailors, moderate media/tiles, and grant roles here. Disputes and
        payout release arrive with Phase 2.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="font-serif text-3xl font-medium tabular-nums">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </div>
    </section>
  );
}
