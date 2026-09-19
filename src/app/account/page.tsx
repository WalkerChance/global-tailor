import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login?next=/account");

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("display_name, phone, shipping_addresses, preferences")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  const { count: profileCount } = await supabase
    .from("measurement_profiles")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", ctx.userId);

  const addresses = Array.isArray(customer?.shipping_addresses)
    ? customer!.shipping_addresses.length
    : 0;

  return (
    <div className="py-10">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
        Customer profile
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium">
        {customer?.display_name || ctx.email}
      </h1>
      <p className="mt-1 font-mono text-xs text-ink-soft">
        Roles: {ctx.roles.join(", ")}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card title="Contact">
          <Row label="Email" value={ctx.email ?? "—"} />
          <Row label="Phone" value={customer?.phone ?? "Not set"} />
        </Card>
        <Card title="Shipping addresses">
          <Row label="Saved" value={`${addresses} address${addresses === 1 ? "" : "es"}`} />
        </Card>
        <Card title="Measurements">
          <Row
            label="Profiles"
            value={`${profileCount ?? 0} saved`}
          />
          <p className="mt-2 text-xs text-ink-soft">
            Reused across orders — in the order loop you confirm or adjust these,
            not re-enter them.
          </p>
        </Card>
        <Card title="Payment methods">
          <Row label="Saved cards" value="Added in Phase 2 (via Stripe)" />
        </Card>
      </div>

      <p className="mt-8 font-mono text-xs text-ink-soft">
        Profile editing UI is a Phase 1 build item. Preferences and saved cards
        are post-MVP.
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-serif text-base font-semibold">{title}</h2>
      <div className="mt-3 flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      <span className="text-right">{value}</span>
    </div>
  );
}
